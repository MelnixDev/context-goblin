export interface ContextGoblinOptions {
  rootDir: string
  maxCacheKb?: number
}

export interface ContextGoblinPluginOptions {
  compactToolOutputs?: boolean
  compactToolOutputThresholdChars?: number
  compactToolOutputKeepStartChars?: number
  compactToolOutputKeepEndChars?: number
  compactToolOutputTools?: string[]
}

export interface OutputCompactionOptions {
  enabled?: boolean
  thresholdChars?: number
  keepStartChars?: number
  keepEndChars?: number
  tools?: string[]
}

export interface ResolvedOutputCompactionOptions {
  enabled: boolean
  thresholdChars: number
  keepStartChars: number
  keepEndChars: number
  tools: string[]
}

export interface CompactToolOutputInput {
  tool: string
  args?: unknown
  output: string
}

export interface CompactToolOutputResult {
  output: string
  compacted: boolean
  originalChars: number
  compactedChars: number
  omittedChars: number
}

export interface DetectedStack {
  packageManager: string | "[NEEDS INPUT]"
  languages: string[]
  frameworks: string[]
  scripts: Record<string, string>
  entryPoints: string[]
  notes: string[]
}

export interface ProjectState {
  version: string
  generatedAt: string
  projectHash: string
  trackedFiles: string[]
  stats?: CacheStats
}

export interface CacheStats {
  cacheBytes: number
  cacheLines: number
  directoryEntries: number
  codeMapFiles: number
  codeMapEntries: number
  sections: string[]
}

export interface CacheStatus {
  exists: boolean
  stale: boolean
  reason: string
  cachePath: string
  statePath: string
  projectHash: string
  state?: ProjectState
}

export interface HashResult {
  hash: string
  trackedFiles: string[]
}
