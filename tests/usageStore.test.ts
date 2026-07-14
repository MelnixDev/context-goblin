import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"

import { describe, expect, it } from "vitest"

import { USAGE_STATE } from "../src/constants.js"
import { getUsageStats, recordUsageStep, tokensFromUnknown } from "../src/usage/store.js"

async function tempRoot() {
  return await fs.mkdtemp(path.join(os.tmpdir(), "context-goblin-usage-"))
}

describe("usage store", () => {
  it("aggregates token usage by day and unique session", async () => {
    const root = await tempRoot()

    await recordUsageStep(root, {
      timestamp: Date.parse("2026-07-13T10:00:00.000Z"),
      sessionID: "session-a",
      tokens: { input: 10, output: 5, reasoning: 1, cacheRead: 20, cacheWrite: 2, total: 38 },
      cost: 0.01,
    })
    await recordUsageStep(root, {
      timestamp: Date.parse("2026-07-13T10:01:00.000Z"),
      sessionID: "session-a",
      tokens: { input: 11, output: 6, reasoning: 2, cacheRead: 21, cacheWrite: 3, total: 43 },
      cost: 0.02,
    })
    await recordUsageStep(root, {
      timestamp: Date.parse("2026-07-12T10:01:00.000Z"),
      sessionID: "session-b",
      tokens: { input: 100, output: 50, reasoning: 10, cacheRead: 200, cacheWrite: 20, total: 380 },
    })

    const stats = await getUsageStats(root, new Date("2026-07-13T12:00:00.000Z"))
    const today = stats.ranges.find((range) => range.label === "today")
    const last7 = stats.ranges.find((range) => range.label === "last7")

    expect(today).toMatchObject({ sessions: 1, steps: 2, cost: 0.03 })
    expect(today?.tokens).toEqual({ input: 21, output: 11, reasoning: 3, cacheRead: 41, cacheWrite: 5, total: 81 })
    expect(last7).toMatchObject({ sessions: 2, steps: 3 })
    expect(last7?.tokens.total).toBe(461)
    expect(stats.recentDays).toHaveLength(2)
    expect(stats.recentDays.at(-1)).toMatchObject({ date: "2026-07-13", sessions: 1, steps: 2 })

    const rawState = await fs.readFile(path.join(root, USAGE_STATE), "utf8")
    expect(rawState).not.toContain("session-a")
    expect(rawState).not.toContain("session-b")
  })

  it("extracts OpenCode step token fields", () => {
    expect(tokensFromUnknown({ input: 1, output: 2, reasoning: 3, total: 10, cache: { read: 4, write: 5 } })).toEqual({
      input: 1,
      output: 2,
      reasoning: 3,
      cacheRead: 4,
      cacheWrite: 5,
      total: 10,
    })
    expect(tokensFromUnknown(undefined)).toBeUndefined()
  })
})
