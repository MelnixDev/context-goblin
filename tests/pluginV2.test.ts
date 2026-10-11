import fs from "node:fs/promises"
import path from "node:path"
import { describe, expect, it, vi } from "vitest"

import serverPlugin from "../src/index.js"
import tuiPlugin from "../src/tui.js"
import { getUsageStats } from "../src/usage/store.js"
import { copyFixture } from "./helpers.js"

function context(root: string, events: unknown[] = []) {
  const tools: Array<any> = []
  const commands: Array<any> = []
  let hook: any
  let signal: AbortSignal | undefined
  const prompt = vi.fn(async () => {})
  const ctx = {
    location: { directory: root }, options: {},
    tool: {
      transform: async (edit: any) => edit({ add: (tool: any) => tools.push(tool) }),
      hook: async (_name: string, callback: any) => { hook = callback },
    },
    command: { transform: async (edit: any) => edit({ add: (command: any) => commands.push(command) }) },
    session: { get: vi.fn(async () => ({ location: { directory: root } })), prompt },
    event: { subscribe: ({ signal: input }: { signal: AbortSignal }) => {
      signal = input
      return (async function* () { for (const event of events) yield event })()
    } },
  }
  return { ctx, tools, commands, prompt, hook: () => hook, signal: () => signal }
}

describe("OpenCode V2 adapter", () => {
  it("registers and executes all six tools with structured content", async () => {
    const root = await copyFixture("react-vite")
    const fake = context(root)
    const cleanup = await serverPlugin.setup(fake.ctx as never)
    expect(fake.tools).toHaveLength(6)
    expect(fake.commands.map((command) => command.name)).toEqual(["context-goblin-stats", "context-goblin-usage"])
    for (const tool of fake.tools) {
      expect(tool.input.type).toBe("object")
      expect(tool.options).toEqual({ codemode: false })
      const result = await tool.execute({}, { sessionID: "session", signal: new AbortController().signal })
      expect(result.content).toBeTypeOf("string")
    }
    await cleanup?.()
    expect(fake.signal()?.aborted).toBe(true)
  })

  it("uses the session directory instead of plugin boot location", async () => {
    const root = await copyFixture("react-vite")
    const other = await copyFixture("node-basic")
    const fake = context(root)
    fake.ctx.session.get.mockResolvedValue({ location: { directory: other } })
    const cleanup = await serverPlugin.setup(fake.ctx as never)
    await fake.tools.find((tool) => tool.name === "context_goblin_get").execute({}, { sessionID: "other", signal: new AbortController().signal })
    expect(await fs.readFile(path.join(other, ".opencode/cache/context-goblin/project-context.md"), "utf8")).toContain("# Context Goblin")
    await expect(fs.access(path.join(root, ".opencode/cache/context-goblin/project-context.md"))).rejects.toThrow()
    await cleanup?.()
  })

  it("fails closed when session location cannot be resolved", async () => {
    const fake = context(await copyFixture("react-vite"))
    fake.ctx.session.get.mockRejectedValue(new Error("session unavailable"))
    const cleanup = await serverPlugin.setup(fake.ctx as never)
    await expect(fake.tools[0].execute({}, { sessionID: "bad" })).rejects.toThrow("session unavailable")
    await cleanup?.()
  })

  it("does not generate a cache for a cancelled tool call", async () => {
    const root = await copyFixture("react-vite")
    const fake = context(root)
    const cleanup = await serverPlugin.setup(fake.ctx as never)
    const controller = new AbortController()
    controller.abort()
    await expect(fake.tools[0].execute({}, { sessionID: "cancelled", signal: controller.signal })).rejects.toThrow("cancelled")
    await expect(fs.access(path.join(root, ".opencode/cache/context-goblin/project-context.md"))).rejects.toThrow()
    await cleanup?.()
  })

  it("submits command templates with the native delivery mode", async () => {
    const fake = context(await copyFixture("react-vite"))
    const cleanup = await serverPlugin.setup(fake.ctx as never)
    const files = [{ uri: "file:///workspace/example.ts" }]
    const agents = [{ name: "reviewer" }]
    await fake.commands[0].execute({ sessionID: "session", delivery: "queue", prompt: { text: "old", files, agents } })
    expect(fake.prompt).toHaveBeenCalledWith(expect.objectContaining({ sessionID: "session", delivery: "queue", files, agents, text: expect.stringContaining("context_goblin_stats") }))
    await cleanup?.()
  })

  it("does not modify tool results by default or compact errors/attachments", async () => {
    const fake = context(await copyFixture("react-vite"))
    const cleanup = await serverPlugin.setup(fake.ctx as never)
    const content = "x".repeat(20000)
    const event = { status: "completed", tool: "shell", input: {}, result: { content, output: { untouched: true } } }
    await fake.hook()(event)
    expect(event.result.content).toBe(content)
    await fake.hook()({ status: "error", tool: "shell", error: {} })
    await cleanup?.()
  })

  it("compacts shell output only when enabled and preserves structured output", async () => {
    const fake = context(await copyFixture("react-vite"))
    fake.ctx.options = { compactToolOutputs: true }
    const cleanup = await serverPlugin.setup(fake.ctx as never)
    const event = { status: "completed", tool: "shell", input: { command: "test" }, result: { content: "x".repeat(20000), output: { untouched: true }, metadata: { existing: 1 } } }
    await fake.hook()(event)
    expect(event.result.content.length).toBeLessThan(20000)
    expect(event.result.output).toEqual({ untouched: true })
    expect(event.result.metadata).toMatchObject({ existing: 1, contextGoblinOutputCompaction: { originalChars: 20000 } })
    const attachments = { status: "completed", tool: "shell", input: {}, result: { content: [{ type: "file", uri: "example" }] } }
    await fake.hook()(attachments)
    expect(attachments.result.content).toHaveLength(1)
    await cleanup?.()
  })

  it("records ended steps once and ignores aggregate usage updates", async () => {
    const root = await copyFixture("react-vite")
    const event = { id: "event", type: "session.step.ended", created: Date.now(), data: { sessionID: "session", tokens: { input: 10, output: 5, reasoning: 0, cache: { read: 0, write: 0 } }, cost: 0.1 } }
    const fake = context(root, [event, event, { ...event, id: "aggregate", type: "session.usage.updated" }])
    const cleanup = await serverPlugin.setup(fake.ctx as never)
    await vi.waitFor(async () => expect((await getUsageStats(root)).ranges[0].steps).toBe(1))
    await cleanup?.()
  })

  it("ignores other workspace telemetry and survives stream failure", async () => {
    const root = await copyFixture("react-vite")
    const other = await copyFixture("node-basic")
    const fake = context(root, [{ id: "foreign", type: "session.step.ended", created: Date.now(), data: { sessionID: "other", tokens: { input: 10, output: 5, reasoning: 0, cache: { read: 0, write: 0 } } } }])
    fake.ctx.session.get.mockResolvedValue({ location: { directory: other } })
    const cleanup = await serverPlugin.setup(fake.ctx as never)
    await new Promise((resolve) => setTimeout(resolve, 10))
    await cleanup?.()
    expect((await getUsageStats(root)).ranges[0].steps).toBe(0)
    expect((await getUsageStats(other)).ranges[0].steps).toBe(0)
    fake.ctx.event.subscribe = () => (async function* () { throw new Error("transport down") })()
    const stop = await serverPlugin.setup(fake.ctx as never)
    await expect(stop?.()).resolves.toBeUndefined()
  })

  it("aborts a live event subscription and awaits its termination on unload", async () => {
    const fake = context(await copyFixture("react-vite"))
    let ended = false
    fake.ctx.event.subscribe = ({ signal }) => (async function* () {
      try {
        await new Promise<void>((resolve) => {
          if (signal.aborted) resolve()
          else signal.addEventListener("abort", () => resolve(), { once: true })
        })
      } finally { ended = true }
    })()
    const stop = await serverPlugin.setup(fake.ctx as never)
    expect(ended).toBe(false)
    await stop?.()
    expect(ended).toBe(true)
  })

  it("registers a V2 TUI layer and shows stats through native toast API", async () => {
    const root = await copyFixture("react-vite")
    let layer: any
    const show = vi.fn()
    await tuiPlugin.setup({ location: { directory: root }, keymap: { layer: (factory: any) => { layer = factory() } }, ui: { router: { current: () => ({ type: "home" }) }, toast: { show } } } as never)
    expect(layer.commands[0].id).toBe("context-goblin.stats")
    await layer.commands[0].run()
    expect(show).toHaveBeenCalledWith(expect.objectContaining({ title: "Context Goblin Stats" }))
  })

  it("shows the selected session's stats rather than the TUI boot location", async () => {
    const root = await copyFixture("react-vite")
    const other = await copyFixture("node-basic")
    const fake = context(other)
    const stop = await serverPlugin.setup(fake.ctx as never)
    await fake.tools[0].execute({}, { sessionID: "session", signal: new AbortController().signal })
    await stop?.()
    let layer: any
    const show = vi.fn()
    const get = vi.fn(() => ({ location: { directory: other } }))
    await tuiPlugin.setup({ location: { directory: root }, data: { session: { get } },
      keymap: { layer: (factory: any) => { layer = factory() } },
      ui: { router: { current: () => ({ type: "session", sessionID: "other" }) }, toast: { show } } } as never)
    await layer.commands[0].run()
    expect(get).toHaveBeenCalledWith("other")
    expect(show).toHaveBeenCalledWith(expect.objectContaining({ variant: "success" }))
  })

  it("fails closed when the selected TUI session is unavailable", async () => {
    let layer: any
    const show = vi.fn()
    await tuiPlugin.setup({ location: { directory: "/must-not-be-read" },
      data: { session: { get: () => undefined } },
      keymap: { layer: (factory: any) => { layer = factory() } },
      ui: { router: { current: () => ({ type: "session", sessionID: "missing" }) }, toast: { show } } } as never)
    await expect(layer.commands[0].run()).resolves.toBeUndefined()
    expect(show).toHaveBeenCalledWith(expect.objectContaining({ variant: "warning", message: expect.stringContaining("No cache was inspected") }))
  })

  it("contains TUI cache/location failures without leaking error details", async () => {
    let layer: any
    const show = vi.fn()
    await tuiPlugin.setup({ data: { session: { get: () => { throw new Error("sensitive detail") } } },
      keymap: { layer: (factory: any) => { layer = factory() } },
      ui: { router: { current: () => ({ type: "session", sessionID: "bad" }) }, toast: { show } } } as never)
    await expect(layer.commands[0].run()).resolves.toBeUndefined()
    expect(show).toHaveBeenCalledWith(expect.objectContaining({ variant: "error", message: expect.not.stringContaining("sensitive") }))
  })
})
