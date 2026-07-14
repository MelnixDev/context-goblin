import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"

import { describe, expect, it } from "vitest"

import { usageEventHook } from "../src/plugin/events.js"
import { getUsageStats } from "../src/usage/store.js"

describe("usage event hook", () => {
  it("records only step finish token events", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "context-goblin-events-"))
    const hook = usageEventHook(root)

    await hook({ event: { type: "text", timestamp: Date.parse("2026-07-13T00:00:00.000Z"), sessionID: "s", part: { text: "secret prompt" } } })
    await hook({ event: { type: "step_finish", timestamp: Date.parse("2026-07-13T00:00:00.000Z"), sessionID: "s", part: { tokens: { input: 3, total: 9, cache: { read: 4 } }, cost: 0.5 } } })

    const stats = await getUsageStats(root, new Date("2026-07-13T01:00:00.000Z"))

    expect(stats.ranges[0]).toMatchObject({ sessions: 1, steps: 1, cost: 0.5 })
    expect(stats.ranges[0].tokens).toEqual({ input: 3, output: 0, reasoning: 0, cacheRead: 4, cacheWrite: 0, total: 9 })
  })
})
