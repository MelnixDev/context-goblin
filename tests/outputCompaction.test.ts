import { describe, expect, it } from "vitest"

import { compactToolOutput } from "../src/outputCompaction.js"

describe("output compaction", () => {
  it("leaves short tool output unchanged", () => {
    const result = compactToolOutput({ tool: "bash", args: { command: "git status --short" }, output: " M README.md\n" })

    expect(result.compacted).toBe(false)
    expect(result.output).toBe(" M README.md\n")
  })

  it("compacts oversized bash output with enough context to continue", () => {
    const output = `${"a".repeat(5000)}\n${"b".repeat(5000)}\n${"c".repeat(5000)}`
    const result = compactToolOutput({ tool: "bash", args: { command: "git diff" }, output }, { thresholdChars: 1000, keepStartChars: 100, keepEndChars: 50 })

    expect(result.compacted).toBe(true)
    expect(result.output).toContain("Context Goblin compacted oversized bash output")
    expect(result.output).toContain("Command: git diff")
    expect(result.output).toContain("--- omitted")
    expect(result.output).toContain("a".repeat(100))
    expect(result.output).toContain("c".repeat(50))
    expect(result.compactedChars).toBeLessThan(result.originalChars)
  })

  it("does not compact exact file reads by default", () => {
    const output = "export const value = 1\n".repeat(1000)
    const result = compactToolOutput({ tool: "read", output }, { thresholdChars: 1000 })

    expect(result.compacted).toBe(false)
    expect(result.output).toBe(output)
  })
})
