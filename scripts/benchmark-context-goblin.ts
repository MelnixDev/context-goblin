import { execFile } from "node:child_process"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { promisify } from "node:util"

import packageJson from "../package.json" with { type: "json" }
import { CACHE_MARKDOWN } from "../src/constants.js"

const execFileAsync = promisify(execFile)
const prompt = "Analyze this project and tell me what stack it uses, commands, entry points, and files to inspect. Do not modify files."

interface Metrics {
  toolCalls: number
  readCalls: number
  uniqueFilesRead: string[]
  contextGoblinStatus: boolean
  contextGoblinRefresh: boolean
  contextGoblinRead: boolean
  cacheSize: number
  cacheLines: number
  deniedFilesAttempted: boolean
  secretLeakage: boolean
  durationMs: number
  inputTokens?: string
  outputTokens?: string
  cost?: string
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function writeFile(root: string, relativePath: string, content: string): Promise<void> {
  const filePath = path.join(root, relativePath)
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, content)
}

async function createLargeRepo(root: string): Promise<void> {
  await writeFile(root, "package.json", JSON.stringify({ scripts: { dev: "vite", build: "tsc", test: "vitest" }, dependencies: { react: "latest", vite: "latest" } }, null, 2))
  await writeFile(root, "tsconfig.json", JSON.stringify({ compilerOptions: { strict: true, jsx: "react-jsx" } }, null, 2))
  await writeFile(root, "vite.config.ts", "export default {}\n")
  await writeFile(root, "src/main.tsx", "export const main = true\n")
  await writeFile(root, ".env", "API_KEY=super-secret-value\n")
  for (let index = 1; index <= 300; index += 1) {
    const padded = String(index).padStart(3, "0")
    await writeFile(root, `src/module-${padded}.ts`, `export const module${padded} = ${index}\n`)
  }
  await writeFile(root, "node_modules/fake-package/index.js", "module.exports = {}\n")
  await writeFile(root, "dist/bundle.js", "console.log('bundle')\n")
  await writeFile(root, "coverage/coverage.json", "{}\n")
}

async function installPluginShim(projectRoot: string, repoRoot: string): Promise<void> {
  await writeFile(projectRoot, ".opencode/plugins/context-goblin.js", `export { default, ContextGoblin } from "file://${path.join(repoRoot, "dist/src/index.js")}"\n`)
}

async function runOpenCode(root: string): Promise<{ output: string; durationMs: number }> {
  const started = Date.now()
  const result = await execFileAsync("opencode", ["run", "--auto", "--format", "json", prompt], { cwd: root, maxBuffer: 20 * 1024 * 1024 })
  return { output: result.stdout, durationMs: Date.now() - started }
}

function parseMetrics(output: string, root: string, durationMs: number, cacheContent = ""): Metrics {
  const uniqueFiles = new Set<string>()
  const deniedPattern = /(node_modules|dist|build|coverage|\.env|private\.key|secrets\.json|credentials\.json)/
  let toolCalls = 0
  let readCalls = 0
  let deniedFilesAttempted = false
  let contextGoblinStatus = false
  let contextGoblinRefresh = false
  let contextGoblinRead = false

  for (const line of output.split("\n")) {
    if (!line.trim()) continue
    if (line.includes("tool")) toolCalls += 1
    if (line.includes("context_goblin_status")) contextGoblinStatus = true
    if (line.includes("context_goblin_refresh")) contextGoblinRefresh = true
    if (line.includes("context_goblin_read")) contextGoblinRead = true
    const readLike = line.includes('"read"') || line.includes("filePath")
    if (readLike) readCalls += 1
    const matches = line.matchAll(/(?:filePath|path)"?\s*[:=]\s*"([^"\n]+)"/g)
    for (const match of matches) {
      const value = match[1]
      if (value.includes(root)) uniqueFiles.add(path.relative(root, value))
      else if (!value.startsWith("/")) uniqueFiles.add(value)
      if (deniedPattern.test(value)) deniedFilesAttempted = true
    }
    if (deniedPattern.test(line) && readLike) deniedFilesAttempted = true
  }

  return {
    toolCalls,
    readCalls,
    uniqueFilesRead: [...uniqueFiles].sort(),
    contextGoblinStatus,
    contextGoblinRefresh,
    contextGoblinRead,
    cacheSize: Buffer.byteLength(cacheContent),
    cacheLines: cacheContent ? cacheContent.split("\n").length : 0,
    deniedFilesAttempted,
    secretLeakage: cacheContent.includes("super-secret"),
    durationMs,
  }
}

function reduction(baseline: number, goblin: number): string {
  if (baseline === 0) return "n/a"
  return `${Math.round(((baseline - goblin) / baseline) * 100)}%`
}

async function opencodeVersion(): Promise<string> {
  try {
    return (await execFileAsync("opencode", ["--version"])).stdout.trim()
  } catch {
    return "not available"
  }
}

async function nodeVersion(): Promise<string> {
  return process.version
}

async function main(): Promise<void> {
  const repoRoot = process.cwd()
  try {
    await execFileAsync("opencode", ["--version"])
  } catch {
    throw new Error("opencode CLI is required for benchmark")
  }

  await execFileAsync("npm", ["run", "build"], { cwd: repoRoot })

  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "context-goblin-benchmark-"))
  const baselineRoot = path.join(tmp, "baseline")
  const goblinRoot = path.join(tmp, "goblin")
  await createLargeRepo(baselineRoot)
  await createLargeRepo(goblinRoot)
  await writeFile(baselineRoot, "opencode.json", JSON.stringify({ $schema: "https://opencode.ai/config.json", permission: { bash: "allow", edit: "deny" } }, null, 2))
  await writeFile(goblinRoot, "opencode.json", JSON.stringify({ $schema: "https://opencode.ai/config.json", permission: { bash: "allow", edit: "deny" } }, null, 2))
  await writeFile(goblinRoot, "AGENTS.md", `# Project Instructions

Before scanning broad repository files, use Context Goblin:
1. Call \`context_goblin_status\`.
2. If stale or missing, call \`context_goblin_refresh\`.
3. Call \`context_goblin_read\`.
4. Read only the smallest set of files required for the task.
`)
  await installPluginShim(goblinRoot, repoRoot)

  const baselineRun = await runOpenCode(baselineRoot)
  const goblinRun = await runOpenCode(goblinRoot)
  const cachePath = path.join(goblinRoot, CACHE_MARKDOWN)
  const cacheContent = (await exists(cachePath)) ? await fs.readFile(cachePath, "utf8") : ""
  const baseline = parseMetrics(baselineRun.output, baselineRoot, baselineRun.durationMs)
  const goblin = parseMetrics(goblinRun.output, goblinRoot, goblinRun.durationMs, cacheContent)
  const pass = cacheContent.length > 0 && goblin.contextGoblinRead && goblin.uniqueFilesRead.length < baseline.uniqueFilesRead.length && !goblin.deniedFilesAttempted && goblin.cacheSize <= 25 * 1024 && !goblin.secretLeakage

  const report = `# Context Goblin Benchmark Report

Generated: ${new Date().toISOString()}
OpenCode version: ${await opencodeVersion()}
Node version: ${await nodeVersion()}
Plugin version: ${packageJson.version}

## Fixture

- Name: large-repo
- Source files: 300
- Secret files: yes
- Generated folders: node_modules, dist, coverage

## Baseline

- Tool calls: ${baseline.toolCalls}
- Unique files read: ${baseline.uniqueFilesRead.length}
- Input tokens: ${baseline.inputTokens ?? "not collected"}
- Output tokens: ${baseline.outputTokens ?? "not collected"}
- Cost: ${baseline.cost ?? "not collected"}
- Duration: ${baseline.durationMs}ms

## Context Goblin

- Tool calls: ${goblin.toolCalls}
- Unique files read: ${goblin.uniqueFilesRead.length}
- context_goblin_status called: ${goblin.contextGoblinStatus}
- context_goblin_refresh called: ${goblin.contextGoblinRefresh}
- context_goblin_read called: ${goblin.contextGoblinRead}
- Cache size: ${goblin.cacheSize}
- Input tokens: ${goblin.inputTokens ?? "not collected"}
- Output tokens: ${goblin.outputTokens ?? "not collected"}
- Cost: ${goblin.cost ?? "not collected"}
- Duration: ${goblin.durationMs}ms

## Result

- File-read reduction: ${reduction(baseline.uniqueFilesRead.length, goblin.uniqueFilesRead.length)}
- Secret leakage: ${goblin.secretLeakage ? "fail" : "pass"}
- Cache size check: ${goblin.cacheSize <= 25 * 1024 ? "pass" : "fail"}
- Pass/fail: ${pass ? "pass" : "fail"}
`

  await fs.mkdir("benchmark-results", { recursive: true })
  await fs.writeFile("benchmark-results/context-goblin-benchmark.md", report)
  console.log(report)
  if (!pass) process.exitCode = 1
}

await main()
