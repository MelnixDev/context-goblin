import fs from "node:fs/promises"
import path from "node:path"
import { execFile } from "node:child_process"
import { promisify } from "node:util"

import { describe, expect, it } from "vitest"

import { cacheStatus } from "../src/cacheStatus.js"
import { CACHE_MARKDOWN, CACHE_STATE } from "../src/constants.js"
import { generateProjectContext } from "../src/generateProjectContext.js"
import { tempProject, writeFile } from "./helpers.js"

const execFileAsync = promisify(execFile)

describe("cacheStatus", () => {
  it("reports missing cache", async () => {
    const root = await tempProject()
    const status = await cacheStatus(root)
    expect(status.exists).toBe(false)
    expect(status.stale).toBe(true)
  })

  it("reports fresh cache when hash matches", async () => {
    const root = await tempProject()
    await writeFile(root, "package.json", JSON.stringify({ name: "x" }))
    await generateProjectContext({ rootDir: root })
    const status = await cacheStatus(root)
    expect(status.exists).toBe(true)
    expect(status.stale).toBe(false)
  })

  it("reports stale when project inputs or source files change", async () => {
    for (const file of ["package.json", "AGENTS.md"]) {
      const root = await tempProject()
      await writeFile(root, "package.json", JSON.stringify({ name: "x" }))
      await generateProjectContext({ rootDir: root })
      await writeFile(root, file, "changed")
      expect((await cacheStatus(root)).stale, file).toBe(true)
    }

    const root = await tempProject()
    await execFileAsync("git", ["init"], { cwd: root })
    await execFileAsync("git", ["config", "user.email", "test@example.com"], { cwd: root })
    await execFileAsync("git", ["config", "user.name", "Test"], { cwd: root })
    await writeFile(root, "package.json", JSON.stringify({ name: "x" }))
    await writeFile(root, "src/index.ts", "export const value = 1")
    await execFileAsync("git", ["add", "."], { cwd: root })
    await execFileAsync("git", ["commit", "-m", "initial"], { cwd: root })
    await generateProjectContext({ rootDir: root })
    await writeFile(root, "src/index.ts", "export const value = 2")
    expect((await cacheStatus(root)).stale).toBe(true)
  })

  it("reports stale when state or markdown is missing", async () => {
    const root = await tempProject()
    await writeFile(root, "package.json", JSON.stringify({ name: "x" }))
    await generateProjectContext({ rootDir: root })
    await fs.rm(path.join(root, CACHE_STATE))
    expect((await cacheStatus(root)).stale).toBe(true)

    await generateProjectContext({ rootDir: root })
    await fs.rm(path.join(root, CACHE_MARKDOWN))
    expect((await cacheStatus(root)).stale).toBe(true)
  })
})
