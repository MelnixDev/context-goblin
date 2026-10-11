import type { Plugin } from "@opencode/plugin/tui"

import { cacheStatus } from "../cache/status.js"
import { formatCacheStatsSummary } from "../tui/statsSummary.js"

export const setupTuiV2: Plugin.Definition["setup"] = (ctx) => {
  ctx.keymap.layer(() => ({
    mode: "global",
    commands: [{
      id: "context-goblin.stats", title: "Context Goblin: Show Stats",
      description: "Show Context Goblin cache freshness, size, tracked files, and code-map coverage.",
      group: "Context Goblin", palette: true,
      slash: { name: "context-goblin-stats", aliases: ["cg-stats"] },
      async run() {
        const location = ctx.location ?? ctx.data.location.default()
        if (!location) return
        const status = await cacheStatus(location.directory)
        ctx.ui.toast.show({
          variant: status.exists && !status.stale ? "success" : "warning",
          title: "Context Goblin Stats", message: formatCacheStatsSummary(status), duration: 8000,
        })
      },
    }],
  }))
}
