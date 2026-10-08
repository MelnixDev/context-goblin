import { describe, expect, it } from "vitest"
import fs from "node:fs/promises"
import path from "node:path"

import { isDeniedPath, redactSecrets } from "../src/security.js"
import { generateProjectContext } from "../src/cache/generate.js"
import { CACHE_MARKDOWN } from "../src/constants.js"
import { tempProject, writeFile } from "./helpers.js"

describe("security", () => {
  it("denies unsafe paths and allows safe metadata paths", () => {
    for (const denied of [
      ".env",
      ".env.local",
      "private.key",
      "secrets.json",
      "credentials.json",
      "node_modules/pkg/index.js",
      "dist/app.js",
      "build/app.js",
      ".git/config",
      ".opencode/cache/context-goblin/project-context.md",
    ]) {
      expect(isDeniedPath(denied), denied).toBe(true)
    }

    for (const allowed of ["package.json", "tsconfig.json", "README.md"]) {
      expect(isDeniedPath(allowed), allowed).toBe(false)
    }
  })

  it("redacts secret-looking assignments", () => {
    const redacted = redactSecrets([
      "API_KEY=abc123",
      "TOKEN=abc123",
      "SECRET=abc123",
      "PASSWORD=abc123",
      "PRIVATE_KEY=abc123",
    ].join("\n"))

    expect(redacted).not.toContain("abc123")
    expect(redacted).toContain("API_KEY=[REDACTED]")
  })

  it("does not modify harmless README text", () => {
    const text = "# Project\n\nThis README contains no credentials."
    expect(redactSecrets(text)).toBe(text)
  })

  it("does not read source links outside the project or into denied paths", async () => {
    const root = await tempProject()
    const outside = await tempProject()
    await writeFile(root, "package.json", JSON.stringify({ name: "safe" }))
    await writeFile(outside, "outside.ts", "export const externalMarker = 1")
    await writeFile(root, "secrets.json", "export const deniedMarker = 1")
    await fs.mkdir(path.join(root, "src"), { recursive: true })
    await fs.symlink(path.join(outside, "outside.ts"), path.join(root, "src", "external.ts"))
    await fs.symlink(path.join(root, "secrets.json"), path.join(root, "src", "denied.ts"))

    await generateProjectContext({ rootDir: root })
    const cache = await fs.readFile(path.join(root, CACHE_MARKDOWN), "utf8")
    expect(cache).not.toContain("externalMarker")
    expect(cache).not.toContain("deniedMarker")
  })

  it("does not copy instruction text or package script bodies into the cache", async () => {
    const root = await tempProject()
    await writeFile(root, "package.json", JSON.stringify({ scripts: { deploy: "echo synthetic-script-marker" } }))
    await writeFile(root, "AGENTS.md", "Authorization: Bearer synthetic-instruction-marker")
    await writeFile(root, "tests/sample.test.ts", "test('synthetic-test-marker', () => {})")

    await generateProjectContext({ rootDir: root })
    const cache = await fs.readFile(path.join(root, CACHE_MARKDOWN), "utf8")
    expect(cache).toContain("- deploy")
    expect(cache).toContain("AGENTS.md exists")
    expect(cache).not.toContain("synthetic-script-marker")
    expect(cache).not.toContain("synthetic-instruction-marker")
    expect(cache).not.toContain("synthetic-test-marker")
  })
})
