import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { spawnSync } from "node:child_process"
import { describe, expect, it } from "vitest"

const checker = path.resolve("scripts/check-reports.mjs")
const baseline = fs.readFileSync("examples/token-usage-ab-report.md", "utf8")
function check(text: string, version = "0.2.0") {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "goblin-report-check-"))
  try {
    fs.mkdirSync(path.join(root, "examples"))
    fs.writeFileSync(path.join(root, "package.json"), JSON.stringify({ version }))
    fs.writeFileSync(path.join(root, "examples/token-usage-ab-report.md"), text)
    return spawnSync(process.execPath, [checker], { cwd: root, encoding: "utf8" })
  } finally { fs.rmSync(root, { recursive: true, force: true }) }
}
describe("historical report evidence", () => {
  it("keeps accurately labelled historical results without changing their tested version", () => {
    expect(check(baseline).status).toBe(0)
  })
  it("rejects old reports that do not disclose their historical status", () => {
    expect(check(baseline.replace(/^Evidence status:.*\n/m, "")).status).toBe(1)
  })
  it("rejects future versions even when labelled historical", () => {
    for (const version of ["0.2.1", "0.3.0", "1.0.0"]) {
      expect(check(baseline.replace("Context Goblin version: 0.1.22", `Context Goblin version: ${version}`)).status).toBe(1)
    }
    expect(check(baseline.replace("Context Goblin version: 0.1.22", "Context Goblin version: 0.1.99"), "0.1.24").status).toBe(1)
  })
  it("compares historical versions across minor and major boundaries", () => {
    expect(check(baseline.replace("Context Goblin version: 0.1.22", "Context Goblin version: 0.1.99")).status).toBe(0)
    expect(check(baseline, "1.0.0").status).toBe(0)
  })
})
