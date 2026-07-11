import { describe, expect, it } from "vitest"

import { formatCacheStatsSummary } from "../src/tui/statsSummary.js"
import type { CacheStatus } from "../src/cache/types.js"

describe("tui stats", () => {
  it("formats missing cache status", () => {
    const status: CacheStatus = {
      exists: false,
      stale: true,
      reason: "missing cache",
      cachePath: "/tmp/cache.md",
      statePath: "/tmp/state.json",
      projectHash: "abc",
    }

    expect(formatCacheStatsSummary(status)).toBe("Context Goblin cache unavailable: missing cache")
  })

  it("formats compact stats for menu display", () => {
    const status: CacheStatus = {
      exists: true,
      stale: false,
      reason: "fresh",
      cachePath: "/tmp/cache.md",
      statePath: "/tmp/state.json",
      projectHash: "abc",
      state: {
        version: "0.1.1",
        generatedAt: "2026-07-11T00:00:00.000Z",
        projectHash: "abc",
        trackedFiles: ["package.json", "README.md"],
        stats: {
          cacheBytes: 7878,
          cacheLines: 206,
          directoryEntries: 56,
          codeMapFiles: 35,
          codeMapEntries: 89,
          sections: ["Detected Stack", "Code Map"],
        },
      },
    }

    expect(formatCacheStatsSummary(status)).toBe("Context Goblin cache fresh; 7.7 KB; 2 tracked files; 35 code-map files; 89 code facts")
  })
})
