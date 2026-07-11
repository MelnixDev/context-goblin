import type { CacheStatus } from "../cache/types.js"

export function formatCacheStatsSummary(status: CacheStatus): string {
  if (!status.exists) return `Context Goblin cache unavailable: ${status.reason}`

  const stats = status.state?.stats
  if (!stats) return `Context Goblin cache ${status.stale ? "stale" : "fresh"}: stats unavailable`

  const cacheKb = (stats.cacheBytes / 1024).toFixed(1)
  const trackedFiles = status.state?.trackedFiles.length ?? 0
  return [
    `Context Goblin cache ${status.stale ? "stale" : "fresh"}`,
    `${cacheKb} KB`,
    `${trackedFiles} tracked files`,
    `${stats.codeMapFiles} code-map files`,
    `${stats.codeMapEntries} code facts`,
  ].join("; ")
}
