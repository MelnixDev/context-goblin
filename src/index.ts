import fs from "node:fs/promises"

import { tool, type Plugin } from "@opencode-ai/plugin"

import { cacheStatus } from "./cacheStatus.js"
import { CACHE_MARKDOWN } from "./constants.js"
import { generateProjectContext } from "./generateProjectContext.js"

export { cacheStatus } from "./cacheStatus.js"
export { detectStack } from "./detectStack.js"
export { generateProjectContext } from "./generateProjectContext.js"
export { hashProjectState } from "./hashProjectState.js"
export { isDeniedPath, redactSecrets } from "./security.js"
export { truncateMarkdown } from "./truncateMarkdown.js"

export const ContextGoblin: Plugin = async () => {
  return {
    tool: {
      context_goblin_status: tool({
        description: "Check whether the Context Goblin project cache exists and is fresh.",
        args: {},
        async execute(_args, context) {
          return JSON.stringify(await cacheStatus(context.worktree), null, 2)
        },
      }),
      context_goblin_refresh: tool({
        description: "Regenerate the Context Goblin project cache safely.",
        args: {
          maxCacheKb: tool.schema.number().optional(),
        },
        async execute(args, context) {
          const state = await generateProjectContext({ rootDir: context.worktree, maxCacheKb: args.maxCacheKb })
          return JSON.stringify({ ok: true, state }, null, 2)
        },
      }),
      context_goblin_read: tool({
        description: "Read the compact Context Goblin project cache.",
        args: {},
        async execute(_args, context) {
          return await fs.readFile(`${context.worktree}/${CACHE_MARKDOWN}`, "utf8")
        },
      }),
    },
  }
}

export default ContextGoblin
