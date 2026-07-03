import { describe, expect, it } from "vitest"

import { CACHE_MARKDOWN } from "../src/constants.js"
import { detectStack } from "../src/detectStack.js"
import { generateProjectContext } from "../src/generateProjectContext.js"
import { byteSize } from "../src/truncateMarkdown.js"
import { copyFixture, readFile } from "./helpers.js"

describe("fixture integration", () => {
  it("node-basic detects Node.js, TypeScript, scripts, and creates compact cache", async () => {
    const root = await copyFixture("node-basic")
    const stack = await detectStack(root)
    await generateProjectContext({ rootDir: root })
    expect(stack.frameworks).toContain("Node.js")
    expect(stack.languages).toContain("TypeScript")
    expect(stack.scripts.build).toBe("tsc")
    expect(byteSize(await readFile(root, CACHE_MARKDOWN))).toBeLessThan(25 * 1024)
  })

  it("react-vite detects React, Vite, TypeScript, and src entry point", async () => {
    const root = await copyFixture("react-vite")
    const stack = await detectStack(root)
    expect(stack.frameworks).toContain("React")
    expect(stack.frameworks).toContain("Vite")
    expect(stack.languages).toContain("TypeScript")
    expect(stack.entryPoints).toContain("src/main.tsx")
  })

  it("next-app detects Next.js, React, app directory, and scripts", async () => {
    const root = await copyFixture("next-app")
    const stack = await detectStack(root)
    expect(stack.frameworks).toContain("Next.js")
    expect(stack.frameworks).toContain("React")
    expect(stack.notes).toContain("Uses app directory")
    expect(stack.scripts.dev).toBe("next dev")
    expect(stack.scripts.build).toBe("next build")
    expect(stack.scripts.test).toBe("vitest")
  })

  it("secret-heavy generates cache without fake secrets", async () => {
    const root = await copyFixture("secret-heavy")
    await generateProjectContext({ rootDir: root })
    const markdown = await readFile(root, CACHE_MARKDOWN)
    expect(markdown).not.toContain("super-secret")
    expect(markdown).toContain(".env")
    expect(markdown).toContain("secrets.json")
  })

  it("large-repo remains compact and skips generated folders", async () => {
    const root = await copyFixture("large-repo")
    await generateProjectContext({ rootDir: root, maxCacheKb: 25 })
    const markdown = await readFile(root, CACHE_MARKDOWN)
    expect(byteSize(markdown)).toBeLessThanOrEqual(25 * 1024)
    expect(markdown).not.toContain("fake-package")
    expect(markdown).not.toContain("bundle.js")
    expect(markdown).not.toContain("coverage.json")
    expect(markdown).not.toContain("module300")
  })
})
