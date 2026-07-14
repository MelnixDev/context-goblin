import type { Config } from "@opencode-ai/plugin"

export const statsCommandName = "context-goblin-stats"
export const usageCommandName = "context-goblin-usage"

export const statsCommand = {
  description: "Show Context Goblin cache freshness, size, tracked files, and code-map coverage.",
  template: [
    "Use Context Goblin to show cache stats for the current workspace.",
    "Call context_goblin_status first.",
    "If the cache is missing or stale, say so and suggest running context_goblin_refresh.",
    "Then call context_goblin_stats and briefly summarize freshness, cache size, tracked files, and code-map coverage.",
    "Do not perform broad repository discovery for this command.",
  ].join("\n"),
}

export const usageCommand = {
  description: "Show local Context Goblin token usage statistics from OpenCode events.",
  template: [
    "Use Context Goblin to show local token usage statistics for the current workspace.",
    "Call context_goblin_usage_stats.",
    "Briefly summarize today, last 7 days, last 30 days, and recent daily totals.",
    "Mention that these are OpenCode event token stats, not guaranteed provider billing totals.",
    "Do not perform repository discovery for this command.",
  ].join("\n"),
}

export function registerContextGoblinCommands(config: Config): void {
  config.command ??= {}
  config.command[statsCommandName] ??= statsCommand
  config.command[usageCommandName] ??= usageCommand
}
