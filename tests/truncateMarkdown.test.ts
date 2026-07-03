import { describe, expect, it } from "vitest"

import { byteSize, truncateMarkdown } from "../src/truncateMarkdown.js"

const critical = `# Context Goblin Project Cache

## Detected Stack
stack

## Important Commands
commands

## Directory Map
map

## Safety Exclusions
exclusions

## Agent Instructions
instructions
`

describe("truncateMarkdown", () => {
  it("leaves markdown under limit unchanged", () => {
    expect(truncateMarkdown(critical, 10)).toBe(critical)
  })

  it("truncates markdown over limit", () => {
    const result = truncateMarkdown(`${critical}\n${"x".repeat(10_000)}`, 2)
    expect(result).toContain("[TRUNCATED]")
    expect(byteSize(result)).toBeLessThanOrEqual(2 * 1024)
  })

  it("preserves header and critical sections", () => {
    const result = truncateMarkdown(`${critical}\n${"x\n".repeat(10_000)}`, 2)
    for (const heading of [
      "# Context Goblin Project Cache",
      "## Detected Stack",
      "## Important Commands",
      "## Directory Map",
      "## Safety Exclusions",
      "## Agent Instructions",
    ]) {
      expect(result).toContain(heading)
    }
  })
})
