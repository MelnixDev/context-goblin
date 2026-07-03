export interface ContextGoblinOptions {
  rootDir: string
  maxCacheKb?: number
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
