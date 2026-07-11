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
