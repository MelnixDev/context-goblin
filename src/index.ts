import fs from "node:fs/promises"

import { tool, type Plugin } from "@opencode-ai/plugin"

import { cacheStatus } from "./cacheStatus.js"
import { CACHE_MARKDOWN } from "./constants.js"
import { generateProjectContext } from "./generateProjectContext.js"
import { compactToolOutput, type OutputCompactionOptions } from "./outputCompaction.js"

export { cacheStatus } from "./cacheStatus.js"
export { detectStack } from "./detectStack.js"
export { generateProjectContext } from "./generateProjectContext.js"
export { hashProjectState } from "./hashProjectState.js"
export { compactToolOutput } from "./outputCompaction.js"
export { isDeniedPath, redactSecrets } from "./security.js"
export { truncateMarkdown } from "./truncateMarkdown.js"

function projectRoot(context: { directory?: string; worktree?: string }): string {
  if (context.directory) return context.directory
  if (context.worktree && context.worktree !== "/") return context.worktree
  return process.cwd()
}

function numberOption(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

function stringArrayOption(value: unknown): string[] | undefined {
  return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : undefined
}

function outputCompactionOptions(options: Record<string, unknown> | undefined): OutputCompactionOptions {
  return {
    enabled: options?.compactToolOutputs !== false,
    thresholdChars: numberOption(options?.compactToolOutputThresholdChars),
    keepStartChars: numberOption(options?.compactToolOutputKeepStartChars),
    keepEndChars: numberOption(options?.compactToolOutputKeepEndChars),
    tools: stringArrayOption(options?.compactToolOutputTools),
  }
}

export const ContextGoblin: Plugin = async (_input, options) => {
  const compaction = outputCompactionOptions(options)
  return {
    "tool.execute.after": async (input, output) => {
      const compacted = compactToolOutput({ tool: input.tool, args: input.args, output: output.output }, compaction)
      if (!compacted.compacted) return
      output.output = compacted.output
      output.metadata = {
        ...output.metadata,
        contextGoblinOutputCompaction: {
          originalChars: compacted.originalChars,
          compactedChars: compacted.compactedChars,
          omittedChars: compacted.omittedChars,
        },
      }
    },
    tool: {
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
    },
  }
}

export default ContextGoblin
