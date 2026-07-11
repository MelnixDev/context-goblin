import type { TuiPlugin } from "@opencode-ai/plugin/tui"

import { cacheStatus } from "../cache/status.js"
import { formatCacheStatsSummary } from "../tui/statsSummary.js"

export const tui: TuiPlugin = async (api) => {
  const unregister = api.command?.register(() => [{
    title: "Context Goblin: Show Stats",
    value: "context-goblin.stats",
    description: "Show Context Goblin cache freshness, size, tracked files, and code-map coverage.",
    category: "Context Goblin",
    slash: {
      name: "context-goblin-stats",
      aliases: ["cg-stats"],
    },
    async onSelect() {
      const root = api.state.path.worktree || api.state.path.directory || process.cwd()
      const status = await cacheStatus(root)
      api.ui.toast({
        variant: status.exists && !status.stale ? "success" : "warning",
        title: "Context Goblin Stats",
        message: formatCacheStatsSummary(status),
        duration: 8000,
      })
    },
  }])

  if (unregister) api.lifecycle.onDispose(unregister)
}
