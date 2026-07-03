import { describe, expect, it } from "vitest"

import { detectStack } from "../src/detectStack.js"
import { tempProject, writeFile } from "./helpers.js"

describe("detectStack", () => {
  it("detects package managers from lockfiles", async () => {
    for (const [lockfile, manager] of [
      ["pnpm-lock.yaml", "pnpm"],
      ["package-lock.json", "npm"],
      ["yarn.lock", "yarn"],
      ["bun.lockb", "bun"],
    ] as const) {
      const root = await tempProject()
      await writeFile(root, lockfile, "")
      expect((await detectStack(root)).packageManager).toBe(manager)
    }
  })

  it("detects TypeScript and JavaScript configs", async () => {
    const tsRoot = await tempProject()
    await writeFile(tsRoot, "tsconfig.json", "{}")
    expect((await detectStack(tsRoot)).languages).toContain("TypeScript")

    const jsRoot = await tempProject()
    await writeFile(jsRoot, "jsconfig.json", "{}")
    expect((await detectStack(jsRoot)).languages).toContain("JavaScript")
  })

  it("detects common frameworks from package.json", async () => {
    const cases = [
      ["react", "React"],
      ["next", "Next.js"],
      ["vite", "Vite"],
      ["express", "Express"],
    ] as const

    for (const [dependency, framework] of cases) {
      const root = await tempProject()
      await writeFile(root, "package.json", JSON.stringify({ dependencies: { [dependency]: "latest" } }))
      expect((await detectStack(root)).frameworks).toContain(framework)
    }
  })

  it("marks missing scripts as needs input", async () => {
    const root = await tempProject()
    await writeFile(root, "package.json", JSON.stringify({ dependencies: {} }))
    expect((await detectStack(root)).notes).toContain("scripts: [NEEDS INPUT]")
  })
})
