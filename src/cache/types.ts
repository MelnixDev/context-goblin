export interface ContextGoblinOptions {
  rootDir: string
  maxCacheKb?: number
}

export interface CacheStats {
  cacheBytes: number
  cacheLines: number
  directoryEntries: number
  codeMapFiles: number
  codeMapEntries: number
  sections: string[]
}

export interface ProjectState {
  version: string
  generatedAt: string
  projectHash: string
  trackedFiles: string[]
  stats?: CacheStats
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
