import type { Plugin } from "@opencode/plugin"

import { compactToolOutput } from "../compaction/outputCompaction.js"
import { recordUsageStep, tokensFromUnknown } from "../usage/store.js"
import { statsCommand, statsCommandName, usageCommand, usageCommandName } from "./commands.js"
import { resolvePluginOptions } from "./options.js"
import { createContextGoblinTools } from "./tools.js"

// Type-only SDK import: V2 definitions are plain objects, so the V2 SDK does not
// become a runtime dependency for users who still run OpenCode V1.
export const setupV2: Plugin.Plugin["setup"] = async (ctx) => {
  const options = resolvePluginOptions(ctx.options)
  const tools = createContextGoblinTools()
  await ctx.tool.transform((editor) => {
    for (const [name, definition] of Object.entries(tools)) {
      editor.add({
        name,
        description: definition.description,
        input: {
          type: "object",
          properties: name === "context_goblin_get" || name === "context_goblin_refresh"
            ? { maxCacheKb: { type: "number" } } : {},
          additionalProperties: false,
        },
        options: { codemode: false },
        async execute(input, context) {
          // A service plugin can observe sessions in other locations. Never use
          // its boot location as a fallback for a session-scoped filesystem read.
          const session = await ctx.session.get({ sessionID: context.sessionID }, { signal: context.signal })
          if (context.signal.aborted) throw new Error("Context Goblin tool was cancelled")
          const root = session.location.directory
          if (!root) throw new Error("OpenCode session has no directory")
          const args = definition.args
          const parsed = Object.fromEntries(Object.entries(args).map(([key, schema]) =>
            [key, schema.parse((input as Record<string, unknown>)[key])]))
          const result = await definition.execute(parsed as never, { directory: root } as never)
          return typeof result === "string" ? { content: result } : { content: result.output, metadata: result.metadata }
        },
      })
    }
  })

  await ctx.command.transform((editor) => {
    for (const [name, command] of [[statsCommandName, statsCommand], [usageCommandName, usageCommand]] as const) {
      editor.add({
        name, description: command.description,
        async execute(invocation) {
          await ctx.session.prompt({ ...invocation.prompt, sessionID: invocation.sessionID, text: command.template, delivery: invocation.delivery })
        },
      })
    }
  })

  await ctx.tool.hook("execute.after", (event) => {
    if (event.status !== "completed" || typeof event.result.content !== "string") return
    const compacted = compactToolOutput({
      tool: event.tool === "shell" ? "bash" : event.tool,
      args: event.input, output: event.result.content,
    }, options.outputCompaction)
    if (!compacted.compacted) return
    event.result = { ...event.result, content: compacted.output, metadata: {
      ...event.result.metadata,
      contextGoblinOutputCompaction: {
        originalChars: compacted.originalChars, compactedChars: compacted.compactedChars,
        omittedChars: compacted.omittedChars,
      },
    } }
  })

  const controller = new AbortController()
  const seen = new Set<string>()
  const subscription = (async () => {
    try {
      for await (const event of ctx.event.subscribe({ signal: controller.signal })) {
        if (controller.signal.aborted) break
        if (event.type !== "session.step.ended" || seen.has(event.id)) continue
        try {
          const session = await ctx.session.get({ sessionID: event.data.sessionID }, { signal: controller.signal })
          // Each location owns its telemetry; other location plugin instances
          // must not write duplicate or cross-project records.
          if (session.location.directory !== ctx.location.directory) continue
          const tokens = tokensFromUnknown(event.data.tokens)
          if (!tokens) continue
          await recordUsageStep(session.location.directory, {
            timestamp: event.created, sessionID: event.data.sessionID,
            tokens, cost: event.data.cost,
          })
          seen.add(event.id)
          if (seen.size > 4096) seen.delete(seen.values().next().value!)
        } catch {
          // Best-effort telemetry must never interrupt the agent lifecycle.
        }
      }
    } catch {
      // Shutdown/transport failures are telemetry failures, not agent failures.
    }
  })()
  return async () => { controller.abort(); await subscription }
}
