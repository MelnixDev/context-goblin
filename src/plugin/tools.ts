import fs from "node:fs/promises"

import { tool } from "@opencode-ai/plugin"

import { cacheStatus } from "../cache/status.js"
import { CACHE_MARKDOWN } from "../constants.js"
import { generateProjectContext } from "../cache/generate.js"
import { getUsageStats } from "../usage/store.js"
import { projectRoot } from "./root.js"

export function createContextGoblinTools() {
  return {
    context_goblin_status: tool({
      description: "Start here before broad repository discovery. Check whether the Context Goblin project cache exists and is fresh; refresh stale or missing caches before reading many files.",
      args: {},
      async execute(_args, context) {
        return JSON.stringify(await cacheStatus(projectRoot(context)), null, 2)
      },
    }),
    context_goblin_refresh: tool({
      description: "Regenerate the safe Context Goblin project cache when status is missing or stale. After refresh, read the cache and call context_goblin_stats to report a short cache summary.",
      args: {
        maxCacheKb: tool.schema.number().optional(),
      },
      async execute(args, context) {
        const state = await generateProjectContext({ rootDir: projectRoot(context), maxCacheKb: args.maxCacheKb })
        return JSON.stringify({ ok: true, state }, null, 2)
      },
    }),
    context_goblin_read: tool({
      description: "Read the compact Context Goblin project cache. Use it to avoid broad discovery reads, then inspect only task-specific files whose implementation details are still missing.",
      args: {},
      async execute(_args, context) {
        return await fs.readFile(`${projectRoot(context)}/${CACHE_MARKDOWN}`, "utf8")
      },
    }),
    context_goblin_stats: tool({
      description: "Read Context Goblin cache status and compact cache statistics. Use after refresh/read to briefly tell the user cache size, tracked files, code-map coverage, and whether the cache is fresh.",
      args: {},
      async execute(_args, context) {
        const root = projectRoot(context)
        const status = await cacheStatus(root)
        return JSON.stringify({
          exists: status.exists,
          stale: status.stale,
          reason: status.reason,
          cachePath: status.cachePath,
          statePath: status.statePath,
          generatedAt: status.state?.generatedAt,
          trackedFiles: status.state?.trackedFiles.length ?? 0,
          stats: status.state?.stats,
        }, null, 2)
      },
    }),
    context_goblin_usage_stats: tool({
      description: "Read local Context Goblin token usage rollups from OpenCode step-finish events. Summarize today, last 7 days, last 30 days, and recent daily totals. These are OpenCode event stats, not guaranteed provider billing totals.",
      args: {},
      async execute(_args, context) {
        return JSON.stringify(await getUsageStats(projectRoot(context)), null, 2)
      },
    }),
  }
}
