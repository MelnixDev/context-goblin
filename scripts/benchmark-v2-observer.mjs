import fs from "node:fs"

// Read-only instrumentation: observe completed calls and steps without
// transforming tools, prompts, permissions, or model settings.
export default {
  id: "context-goblin.benchmark-observer",
  async setup(ctx) {
    const append = (record) => fs.appendFileSync(ctx.options.evidencePath, JSON.stringify(record) + "\n")
    await ctx.tool.hook("execute.after", (event) => {
      append({ type: "tool", tool: event.tool, id: event.id, sessionID: event.sessionID,
        status: event.status, input: event.input,
        secretLeak: event.status === "completed" && JSON.stringify(event.result).includes("super-secret") })
    })
    const controller = new AbortController()
    const subscription = (async () => {
      try {
        for await (const event of ctx.event.subscribe({ signal: controller.signal })) {
          if (event.type === "session.step.ended") {
            append({ type: "step", id: event.id, sessionID: event.data.sessionID,
              tokens: event.data.tokens, cost: event.data.cost, finish: event.data.finish })
          }
        }
      } catch (error) {
        if (!controller.signal.aborted) append({ type: "observer-error", message: error.message })
      }
    })()
    return async () => { controller.abort(); await subscription }
  },
}
