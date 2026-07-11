import type { OutputCompactionOptions } from "../compaction/types.js"

export interface ContextGoblinPluginOptions {
  compactToolOutputs?: boolean
  compactToolOutputThresholdChars?: number
  compactToolOutputKeepStartChars?: number
  compactToolOutputKeepEndChars?: number
  compactToolOutputTools?: string[]
}

export interface ResolvedPluginOptions {
  outputCompaction: OutputCompactionOptions
}
