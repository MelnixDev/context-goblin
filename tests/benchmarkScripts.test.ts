import fs from "node:fs"
import path from "node:path"
import os from "node:os"
import { spawnSync } from "node:child_process"
import { afterEach, describe, expect, it } from "vitest"

const runner = path.join(process.cwd(), "scripts/run-opencode.mjs")
const reportSource = fs.readFileSync("scripts/model-ab.sh", "utf8").split("node <<'NODE'\n")[1]!.split("\nNODE")[0]!
const packageVersion = JSON.parse(fs.readFileSync("package.json", "utf8")).version
const temporaryRoots: string[] = []
afterEach(() => {
  for (const root of temporaryRoots.splice(0)) fs.rmSync(root, { recursive: true, force: true })
})

function checkReport(options: { secondTotal?: number; version?: string; requestedModels?: string; secondAnswer?: string } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "context-goblin-benchmark-"))
  temporaryRoots.push(root)
  const report = path.join(root, "report.md")
  const metadata = path.join(root, "metadata.tsv")
  fs.writeFileSync(report, "Previous completed report")
  const answer = "Save for later: cartStore.ts savedItems CartDrawer.tsx ProductCard.tsx cartStore.test.ts vitest risks .env exclusion"
  const rows = ["first", "second"].map((model) => {
    const baselineRoot = path.join(root, model, "baseline")
    const goblinRoot = path.join(root, model, "goblin")
    const cacheDir = path.join(goblinRoot, ".opencode/cache/context-goblin")
    fs.mkdirSync(baselineRoot, { recursive: true })
    fs.mkdirSync(cacheDir, { recursive: true })
    fs.writeFileSync(path.join(cacheDir, "project-context.md"), "Project cache")
    fs.writeFileSync(path.join(cacheDir, "project-context.state.json"), "{}")
    const baselineRaw = path.join(baselineRoot, "events.jsonl")
    const goblinRaw = path.join(goblinRoot, "events.jsonl")
    const events = (reads: number, input: number, total: number, text: string, goblin: boolean) => [
      ...(goblin ? [{ part: { type: "tool", tool: "context_goblin_get" } }] : []),
      ...Array.from({ length: reads }, (_, index) => ({ part: { type: "tool", tool: "read", state: { input: { filePath: `file${index}.ts` } } } })),
      { part: { type: "text", text } }, { part: { tokens: { input, total } } },
    ].map((event) => JSON.stringify(event)).join("\n") + "\n"
    fs.writeFileSync(baselineRaw, events(3, 1000, 2000, answer, false))
    fs.writeFileSync(goblinRaw, events(1, 500, model === "second" ? options.secondTotal ?? 1000 : 1000, model === "second" ? options.secondAnswer ?? answer : answer, true))
    return [model, baselineRoot, goblinRoot, baselineRaw, goblinRaw, "", "", 0, 1, 0, 1, model, options.version ?? packageVersion].join("\t")
  })
  fs.writeFileSync(metadata, rows.join("\n") + "\n")
  const result = spawnSync(process.execPath, ["-e", reportSource], {
    encoding: "utf8", env: { ...process.env, REPO_ROOT: process.cwd(), METADATA_PATH: metadata, REPORT_PATH: report, EXPECTED_MODELS: options.requestedModels ?? "first second", TOKEN_REPORT: "1" },
  })
  return { ...result, report: fs.readFileSync(report, "utf8") }
}

describe("OpenCode verification scripts", () => {
  it("parses the JavaScript embedded in shell verification scripts", () => {
    for (const name of ["model-ab.sh", "smoke-opencode.sh", "smoke-opencode-live.sh"]) {
      const script = fs.readFileSync(path.join("scripts", name), "utf8")
      const blocks = [...script.matchAll(/<<'NODE'\n([\s\S]*?)\nNODE/g)]
      expect(blocks.length).toBeGreaterThan(0)
      for (const block of blocks) {
        const check = spawnSync(process.execPath, ["--input-type=module", "--check"], { input: block[1], encoding: "utf8" })
        expect(check.status, `${name}: ${check.stderr}`).toBe(0)
      }
    }
  })

  it("stops immediately after a provider error instead of retrying", () => {
    const result = spawnSync(process.execPath, [runner, process.execPath, "-e", 'console.log(JSON.stringify({type:"error",error:{data:{statusCode:429,message:"usage limit"}}})); setInterval(() => {}, 1000)'], {
      encoding: "utf8", timeout: 5_000, env: { ...process.env, OPENCODE_TIMEOUT_MS: "4000" },
    })
    expect(result.status).toBe(1)
    expect(result.stderr).toContain("OpenCode emitted an error")
  })

  it("bounds a stalled OpenCode process", () => {
    const result = spawnSync(process.execPath, [runner, process.execPath, "-e", "setInterval(() => {}, 1000)"], {
      encoding: "utf8", timeout: 5_000, env: { ...process.env, OPENCODE_TIMEOUT_MS: "150" },
    })
    expect(result.status).toBe(124)
    expect(result.stderr).toContain("timed out")
  })

  it("passes only when every requested model passes compatibility and efficiency", () => {
    const result = checkReport()
    expect(result.status, result.stderr).toBe(0)
    expect(result.report).toContain("| second | 1000 | 500 | 50% | pass |")
  })

  it.each([2000, 3000])("fails when one model has flat or regressing total tokens (%s)", (secondTotal) => {
    const result = checkReport({ secondTotal })
    expect(result.status).toBe(1)
    expect(result.report).toContain(secondTotal === 2000 ? "mixed |" : "fail |")
  })

  it("fails when a model answer misses the feature checklist despite fewer tokens", () => {
    expect(checkReport({ secondAnswer: "Save for later" }).status).toBe(1)
  })

  it("preserves completed evidence when reused metadata is from another version", () => {
    const result = checkReport({ version: "0.0.0" })
    expect(result.status).toBe(1)
    expect(result.report).toBe("Previous completed report")
  })

  it("preserves completed evidence when a requested model is missing", () => {
    const result = checkReport({ requestedModels: "first second missing" })
    expect(result.status).toBe(1)
    expect(result.report).toBe("Previous completed report")
  })
})
