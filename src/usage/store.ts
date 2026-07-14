import crypto from "node:crypto"
import fs from "node:fs/promises"
import path from "node:path"

import { USAGE_STATE } from "../constants.js"
import type { UsageDay, UsageState, UsageStats, UsageStatsRange, UsageTokens } from "./types.js"

const emptyTokens = (): UsageTokens => ({ input: 0, output: 0, reasoning: 0, cacheRead: 0, cacheWrite: 0, total: 0 })

const emptyState = (): UsageState => ({ version: 1, days: {} })

function usageStatePath(root: string): string {
  return path.join(root, USAGE_STATE)
}

function isoDate(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10)
}

function addTokens(target: UsageTokens, source: UsageTokens): void {
  target.input += source.input
  target.output += source.output
  target.reasoning += source.reasoning
  target.cacheRead += source.cacheRead
  target.cacheWrite += source.cacheWrite
  target.total += source.total
}

function sessionHash(sessionID: string): string {
  return crypto.createHash("sha256").update(sessionID).digest("hex").slice(0, 16)
}

async function readUsageState(root: string): Promise<UsageState> {
  try {
    const parsed = JSON.parse(await fs.readFile(usageStatePath(root), "utf8")) as Partial<UsageState>
    if (parsed.version !== 1 || !parsed.days || typeof parsed.days !== "object") return emptyState()
    return parsed as UsageState
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return emptyState()
    return emptyState()
  }
}

async function writeUsageState(root: string, state: UsageState): Promise<void> {
  const statePath = usageStatePath(root)
  await fs.mkdir(path.dirname(statePath), { recursive: true })
  await fs.writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`)
}

function normalizeDay(date: string, day?: Partial<UsageDay>): UsageDay {
  return {
    date,
    steps: day?.steps ?? 0,
    sessionHashes: Array.isArray(day?.sessionHashes) ? day.sessionHashes : [],
    tokens: { ...emptyTokens(), ...day?.tokens },
    cost: day?.cost ?? 0,
  }
}

export async function recordUsageStep(root: string, input: {
  timestamp: number
  sessionID?: string
  tokens: UsageTokens
  cost?: number
}): Promise<void> {
  const state = await readUsageState(root)
  const date = isoDate(input.timestamp)
  const day = normalizeDay(date, state.days[date])
  day.steps += 1
  addTokens(day.tokens, input.tokens)
  day.cost += input.cost ?? 0

  if (input.sessionID) {
    const hashed = sessionHash(input.sessionID)
    if (!day.sessionHashes.includes(hashed)) day.sessionHashes.push(hashed)
  }

  state.days[date] = day
  await writeUsageState(root, state)
}

function dateBefore(date: Date, days: number): Date {
  const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  copy.setUTCDate(copy.getUTCDate() - days)
  return copy
}

function rangeStats(days: UsageDay[], label: string, rangeDays: number, now: Date): UsageStatsRange {
  const start = dateBefore(now, rangeDays - 1).toISOString().slice(0, 10)
  const sessionHashes = new Set<string>()
  const tokens = emptyTokens()
  let steps = 0
  let cost = 0

  for (const day of days) {
    if (day.date < start) continue
    steps += day.steps
    cost += day.cost
    addTokens(tokens, day.tokens)
    for (const hash of day.sessionHashes) sessionHashes.add(hash)
  }

  return { label, days: rangeDays, sessions: sessionHashes.size, steps, tokens, cost }
}

export async function getUsageStats(root: string, now = new Date()): Promise<UsageStats> {
  const state = await readUsageState(root)
  const days = Object.values(state.days).map((day) => normalizeDay(day.date, day)).sort((a, b) => a.date.localeCompare(b.date))
  const recentDays = days.slice(-14).map(({ sessionHashes, ...day }) => ({ ...day, sessions: sessionHashes.length }))

  return {
    statePath: usageStatePath(root),
    ranges: [
      rangeStats(days, "today", 1, now),
      rangeStats(days, "last7", 7, now),
      rangeStats(days, "last30", 30, now),
    ],
    recentDays,
  }
}

export function tokensFromUnknown(input: unknown): UsageTokens | undefined {
  if (!input || typeof input !== "object") return undefined
  const tokens = input as { input?: number; output?: number; reasoning?: number; total?: number; cache?: { read?: number; write?: number } }
  return {
    input: tokens.input ?? 0,
    output: tokens.output ?? 0,
    reasoning: tokens.reasoning ?? 0,
    cacheRead: tokens.cache?.read ?? 0,
    cacheWrite: tokens.cache?.write ?? 0,
    total: tokens.total ?? 0,
  }
}
