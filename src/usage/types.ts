export interface UsageTokens {
  input: number
  output: number
  reasoning: number
  cacheRead: number
  cacheWrite: number
  total: number
}

export interface UsageDay {
  date: string
  steps: number
  sessionHashes: string[]
  tokens: UsageTokens
  cost: number
}

export interface UsageState {
  version: 1
  days: Record<string, UsageDay>
}

export interface UsageStatsRange {
  label: string
  days: number
  sessions: number
  steps: number
  tokens: UsageTokens
  cost: number
}

export interface UsageStats {
  statePath: string
  ranges: UsageStatsRange[]
  recentDays: Array<Omit<UsageDay, "sessionHashes"> & { sessions: number }>
}
