import { describe, expect, it } from "vitest"

import { projectRoot } from "../src/plugin/root.js"

describe("project root", () => {
  it("prefers OpenCode's current project directory", () => {
    expect(projectRoot({ directory: "/repo/packages/app", worktree: "/repo" })).toBe("/repo/packages/app")
  })

  it("falls back to the stable worktree root", () => {
    expect(projectRoot({ worktree: "/repo" })).toBe("/repo")
  })
})
