import type { Plugin } from "@opencode/plugin/tui"

import { cacheStatus } from "../cache/status.js"
import { formatCacheStatsSummary } from "../tui/statsSummary.js"

export const setupTuiV2 = ((input: unknown) => {
  const ctx = input as Plugin.Context
  ctx.keymap.layer(() => ({
    mode: "global",
    commands: [{
      id: "context-goblin.stats", title: "Context Goblin: Show Stats",
      description: "Show Context Goblin cache freshness, size, tracked files, and code-map coverage.",
      group: "Context Goblin", palette: true,
      slash: { name: "context-goblin-stats", aliases: ["cg-stats"] },
      async run() {
        try {
          const route = ctx.ui.router.current()
          // A global layer can run in a session belonging to another location.
          // Never show boot-directory stats as if they belonged to that session.
          const location = route.type === "session"
            ? ctx.data.session.get(route.sessionID)?.location
            : ctx.location ?? ctx.data.location.default()
          if (!location?.directory) {
            ctx.ui.toast.show({ variant: "warning", title: "Context Goblin Stats",
              message: "The current session location is unavailable. No cache was inspected." })
            return
          }
          const status = await cacheStatus(location.directory)
          ctx.ui.toast.show({
            variant: status.exists && !status.stale ? "success" : "warning",
            title: "Context Goblin Stats", message: formatCacheStatsSummary(status), duration: 8000,
          })
        } catch {
          // Filesystem/cache failures must not escape a native UI command.
          ctx.ui.toast.show({ variant: "error", title: "Context Goblin Stats",
            message: "Could not read cache statistics for the current location." })
        }
      },
    }],
  }))
}) satisfies Plugin.Definition["setup"]
