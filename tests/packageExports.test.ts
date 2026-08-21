import fs from "node:fs/promises"
import path from "node:path"

import { describe, expect, it } from "vitest"

import serverPlugin, { ContextGoblin } from "../src/index.js"
import tuiPlugin, { tui } from "../src/tui.js"

describe("package exports", () => {
  it("publishes separate server and TUI entrypoints", async () => {
    const packageJson = JSON.parse(await fs.readFile(path.join(process.cwd(), "package.json"), "utf8")) as {
      exports?: Record<string, { import?: string; types?: string }>
    }

    expect(packageJson.exports?.["."]).toEqual({
      import: "./dist/src/index.js",
      types: "./dist/src/index.d.ts",
    })
    expect(packageJson.exports?.["./tui"]).toEqual({
      import: "./dist/src/tui.js",
      types: "./dist/src/tui.d.ts",
    })
  })

  it("keeps the TUI module separate from the server plugin module", async () => {
    const tuiModule = await import("../src/tui.js")

    expect(tuiModule.tui).toBeTypeOf("function")
    expect("ContextGoblin" in tuiModule).toBe(false)
  })

  it("uses explicit OpenCode module entrypoints", () => {
    expect(serverPlugin).toEqual({ id: "context-goblin", server: ContextGoblin })
    expect(tuiPlugin).toEqual({ id: "context-goblin", tui })
  })
})
