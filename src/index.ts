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

function projectRoot(context: { directory?: string; worktree?: string }): string {
  if (context.directory) return context.directory
  if (context.worktree && context.worktree !== "/") return context.worktree
  return process.cwd()
}

export const ContextGoblin: Plugin = async () => {
  return {
    tool: {
      context_goblin_status: tool({
        description: "Check whether the Context Goblin project cache exists and is fresh.",
        args: {},
        async execute(_args, context) {
          return JSON.stringify(await cacheStatus(projectRoot(context)), null, 2)
        },
      }),
      context_goblin_refresh: tool({
        description: "Regenerate the Context Goblin project cache safely.",
        args: {
          maxCacheKb: tool.schema.number().optional(),
        },
        async execute(args, context) {
          const state = await generateProjectContext({ rootDir: projectRoot(context), maxCacheKb: args.maxCacheKb })
          return JSON.stringify({ ok: true, state }, null, 2)
        },
      }),
      context_goblin_read: tool({
        description: "Read the compact Context Goblin project cache.",
        args: {},
        async execute(_args, context) {
          return await fs.readFile(`${projectRoot(context)}/${CACHE_MARKDOWN}`, "utf8")
        },
      }),
    },
  }
}

export default ContextGoblin
