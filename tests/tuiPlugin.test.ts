import { describe, expect, it } from "vitest"

import { tui } from "../src/tui.js"

function fakeApi(overrides: Record<string, unknown> = {}) {
  const disposers: unknown[] = []
  return {
    api: {
      state: { path: { worktree: process.cwd(), directory: process.cwd() } },
      ui: { toast() {} },
      lifecycle: {
        onDispose(dispose: unknown) {
          disposers.push(dispose)
          return () => {}
        },
      },
      ...overrides,
    },
    disposers,
  }
}

describe("TUI plugin", () => {
  it("registers the stats command through modern keymap layers", async () => {
    let layer: { commands?: Array<Record<string, unknown>> } | undefined
    const { api, disposers } = fakeApi({
      keymap: {
        registerLayer(input: typeof layer) {
          layer = input
          return () => {}
        },
      },
    })

    await tui(api as never, undefined, { id: "context-goblin/tui" } as never)

    expect(layer?.commands).toHaveLength(1)
    expect(layer?.commands?.[0]).toMatchObject({
      name: "context-goblin.stats",
      title: "Context Goblin: Show Stats",
      description: "Show Context Goblin cache freshness, size, tracked files, and code-map coverage.",
      category: "Context Goblin",
      slash: {
        name: "context-goblin-stats",
        aliases: ["cg-stats"],
      },
    })
    expect(layer?.commands?.[0]?.run).toBeTypeOf("function")
    expect(disposers).toHaveLength(1)
  })

  it("falls back to legacy command registration when keymap layers are unavailable", async () => {
    let commands: Array<Record<string, unknown>> = []
    const { api, disposers } = fakeApi({
      keymap: {},
      command: {
        register(callback: () => Array<Record<string, unknown>>) {
          commands = callback()
          return () => {}
        },
      },
    })

    await tui(api as never, undefined, { id: "context-goblin/tui" } as never)

    expect(commands).toHaveLength(1)
    expect(commands[0]).toMatchObject({
      title: "Context Goblin: Show Stats",
      value: "context-goblin.stats",
      category: "Context Goblin",
      slash: {
        name: "context-goblin-stats",
        aliases: ["cg-stats"],
      },
    })
    expect(commands[0]?.onSelect).toBeTypeOf("function")
    expect(disposers).toHaveLength(1)
  })
})
