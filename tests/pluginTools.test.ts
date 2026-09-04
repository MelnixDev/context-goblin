import fs from "node:fs/promises"
import path from "node:path"
import { describe, expect, it } from "vitest"

import { CACHE_MARKDOWN } from "../src/constants.js"
import { getFreshProjectContext } from "../src/plugin/tools.js"
import { copyFixture, writeFile } from "./helpers.js"

describe("Context Goblin low-overhead context tool", () => {
  it("creates a missing cache and returns it in one operation", async () => {
    const root = await copyFixture("react-vite")

    const context = await getFreshProjectContext(root)

    expect(context).toContain("# Context Goblin Project Cache")
    expect(await fs.readFile(path.join(root, CACHE_MARKDOWN), "utf8")).toBe(context)
  })

  it("refreshes a stale cache before returning it", async () => {
    const root = await copyFixture("react-vite")
    const initial = await getFreshProjectContext(root)
    await writeFile(root, "AGENTS.md", "Prefer the new single-call Context Goblin flow.\n")

    const refreshed = await getFreshProjectContext(root)

    expect(refreshed).not.toBe(initial)
    expect(refreshed).toContain("Prefer the new single-call Context Goblin flow.")
  })
})
