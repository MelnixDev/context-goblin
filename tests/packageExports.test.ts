import fs from "node:fs/promises"
import path from "node:path"

import { describe, expect, it } from "vitest"

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
    expect("default" in tuiModule).toBe(false)
    expect("ContextGoblin" in tuiModule).toBe(false)
  })
})
