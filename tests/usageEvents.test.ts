import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"

import { afterEach, describe, expect, it, vi } from "vitest"

import { usageEventHook } from "../src/plugin/events.js"
import { getUsageStats } from "../src/usage/store.js"

describe("usage event hook", () => {
  afterEach(() => vi.useRealTimers())

  it("records only step finish token events", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "context-goblin-events-"))
    const hook = usageEventHook(root)
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-07-13T00:00:00.000Z"))

    await hook({ event: { type: "message.part.updated", properties: { part: { id: "text", sessionID: "s", messageID: "m", type: "text", text: "secret prompt" } } } })
    await hook({ event: { type: "message.part.updated", properties: { part: { id: "step", sessionID: "s", messageID: "m", type: "step-finish", reason: "stop", tokens: { input: 3, output: 2, reasoning: 0, cache: { read: 4, write: 0 } }, cost: 0.5 } } } })

    const stats = await getUsageStats(root, new Date("2026-07-13T01:00:00.000Z"))

    expect(stats.ranges[0]).toMatchObject({ sessions: 1, steps: 1, cost: 0.5 })
    expect(stats.ranges[0].tokens).toEqual({ input: 3, output: 2, reasoning: 0, cacheRead: 4, cacheWrite: 0, total: 0 })
  })
})
