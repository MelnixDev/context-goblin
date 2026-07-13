import type { TuiPlugin } from "@opencode-ai/plugin/tui"

import { cacheStatus } from "../cache/status.js"
import { formatCacheStatsSummary } from "../tui/statsSummary.js"

const commandName = "context-goblin.stats"
const commandTitle = "Context Goblin: Show Stats"
const commandDescription = "Show Context Goblin cache freshness, size, tracked files, and code-map coverage."

async function showStatsToast(api: Parameters<TuiPlugin>[0]): Promise<void> {
  const root = api.state.path.worktree || api.state.path.directory || process.cwd()
  const status = await cacheStatus(root)
  api.ui.toast({
    variant: status.exists && !status.stale ? "success" : "warning",
    title: "Context Goblin Stats",
    message: formatCacheStatsSummary(status),
    duration: 8000,
  })
}

export const tui: TuiPlugin = async (api) => {
  const keymap = api.keymap as unknown as { registerLayer?: (layer: unknown) => () => void }
  if (typeof keymap.registerLayer === "function") {
    const unregister = keymap.registerLayer({
      commands: [{
        name: commandName,
        title: commandTitle,
        description: commandDescription,
        category: "Context Goblin",
        slash: {
          name: "context-goblin-stats",
          aliases: ["cg-stats"],
        },
        run: () => showStatsToast(api),
      }],
    })
    api.lifecycle.onDispose(unregister)
    return
  }

  const unregister = api.command?.register(() => [{
    title: commandTitle,
    value: commandName,
    description: commandDescription,
    category: "Context Goblin",
    slash: {
      name: "context-goblin-stats",
      aliases: ["cg-stats"],
    },
    onSelect: () => showStatsToast(api),
  }])

  if (unregister) api.lifecycle.onDispose(unregister)
}
