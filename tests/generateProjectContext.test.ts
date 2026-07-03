import fs from "node:fs/promises"
import path from "node:path"

import { describe, expect, it } from "vitest"

import { CACHE_MARKDOWN, CACHE_STATE } from "../src/constants.js"
import { generateProjectContext } from "../src/generateProjectContext.js"
import { byteSize } from "../src/truncateMarkdown.js"
import { tempProject, writeFile, readFile } from "./helpers.js"

describe("generateProjectContext", () => {
  it("creates safe markdown cache and state JSON", async () => {
    const root = await tempProject()
    await writeFile(root, "package.json", JSON.stringify({ scripts: { test: "vitest" }, dependencies: { react: "latest" } }))
    await writeFile(root, "tsconfig.json", "{}")
    await writeFile(root, "src/index.ts", "export const value = 1")
    await writeFile(root, ".env", "API_KEY=super-secret-value")
    await writeFile(root, "private.key", "PRIVATE_KEY=super-secret-private-key")

    await generateProjectContext({ rootDir: root, maxCacheKb: 8 })

    const markdown = await readFile(root, CACHE_MARKDOWN)
    const state = JSON.parse(await readFile(root, CACHE_STATE)) as Record<string, unknown>

    await expect(fs.access(path.join(root, CACHE_MARKDOWN))).resolves.toBeUndefined()
    await expect(fs.access(path.join(root, CACHE_STATE))).resolves.toBeUndefined()
    for (const heading of [
      "# Context Goblin Project Cache",
      "## Detected Stack",
      "## Important Commands",
      "## Directory Map",
      "## Safety Exclusions",
      "## Agent Instructions",
    ]) {
      expect(markdown).toContain(heading)
    }
    expect(markdown).not.toContain("super-secret-value")
    expect(markdown).not.toContain("super-secret-private-key")
    expect(byteSize(markdown)).toBeLessThanOrEqual(8 * 1024)
    expect(state.version).toBeTypeOf("string")
    expect(state.generatedAt).toBeTypeOf("string")
    expect(state.projectHash).toBeTypeOf("string")
    expect(state.trackedFiles).toBeInstanceOf(Array)
  })
})
