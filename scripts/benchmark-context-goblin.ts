import { execFile } from "node:child_process"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { promisify } from "node:util"

import packageJson from "../package.json" with { type: "json" }
import { CACHE_MARKDOWN } from "../src/constants.js"

const execFileAsync = promisify(execFile)
const OPENCODE_TIMEOUT_MS = Number(process.env.CONTEXT_GOBLIN_BENCHMARK_TIMEOUT_MS ?? 180_000)

const baselinePrompt = `Analyze this project and tell me:
1. what stack it uses,
2. what commands are available,
3. where the main entry points are,
4. which files you would inspect before changing the main app behavior.

You may inspect repository files as needed. Do not modify files.`

const goblinPrompt = `Analyze this project and tell me:
1. what stack it uses,
2. what commands are available,
3. where the main entry points are,
4. which files you would inspect before changing the main app behavior.

Before scanning broad repository files, use Context Goblin:
1. Call context_goblin_status.
2. If stale or missing, call context_goblin_refresh.
3. Call context_goblin_read.
4. Read only the smallest set of files required for this task.

Do not modify files.`

interface Metrics {
  toolCalls: number
  readCalls: number
  bashCalls: number
  globCalls: number
  grepCalls: number
  uniqueFilesRead: string[]
  toolCounts: Record<string, number>
  contextGoblinStatus: boolean
  contextGoblinRefresh: boolean
  contextGoblinRead: boolean
  cacheSize: number
  cacheLines: number
  deniedFilesAttempted: boolean
  secretLeakage: boolean
  durationMs: number
  inputTokens: number
  outputTokens: number
  reasoningTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
  totalTokens: number
  cost: number
}

interface OpenCodeRun {
  output: string
  durationMs: number
  ok: boolean
  error?: string
}

interface JsonRecord {
  type?: string
  part?: {
    type?: string
    tool?: string
    state?: {
      input?: unknown
      status?: string
    }
    tokens?: {
      total?: number
      input?: number
      output?: number
      reasoning?: number
      cache?: {
        read?: number
        write?: number
      }
    }
    cost?: number
  }
}

const deniedPattern = /(^|\/)(node_modules|dist|build|coverage)(\/|$)|(^|\/)\.env(\.|$)|private\.key|secrets\.json|credentials\.json/

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
  await writeFile(root, "src/App.tsx", "export function App() { return null }\n")
  await writeFile(root, ".env", "API_KEY=super-secret-value\nPASSWORD=super-secret-password\n")
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

async function runOpenCode(root: string, prompt: string, options: { isolatedConfig?: boolean }): Promise<OpenCodeRun> {
  const started = Date.now()
  const args = ["run", "--auto", "--format", "json", "--dir", root, prompt]
  const configDir = options.isolatedConfig ? path.join(root, ".benchmark-opencode-config") : undefined
  if (configDir) {
    await fs.mkdir(configDir, { recursive: true })
    await fs.writeFile(path.join(configDir, "opencode.json"), `${JSON.stringify({ $schema: "https://opencode.ai/config.json" }, null, 2)}\n`)
  }
  try {
    const result = await execFileAsync("opencode", args, {
      maxBuffer: 30 * 1024 * 1024,
      timeout: OPENCODE_TIMEOUT_MS,
      env: configDir ? { ...process.env, OPENCODE_CONFIG_DIR: configDir } : process.env,
    })
    return { output: result.stdout, durationMs: Date.now() - started, ok: true }
  } catch (error) {
    const failed = error as { stdout?: string; stderr?: string; message?: string; killed?: boolean; signal?: string }
    const detail = [
      `OpenCode benchmark run failed after ${Date.now() - started}ms`,
      `Command: opencode ${args.map((arg) => JSON.stringify(arg)).join(" ")}`,
      `Isolated config: ${Boolean(configDir)}`,
      `Killed: ${failed.killed ?? false}`,
      `Signal: ${failed.signal ?? "none"}`,
      `Message: ${failed.message ?? "unknown"}`,
      "--- stdout ---",
      failed.stdout ?? "",
      "--- stderr ---",
      failed.stderr ?? "",
    ].join("\n")
    return { output: failed.stdout ?? "", durationMs: Date.now() - started, ok: false, error: detail }
  }
}

function parseJsonLines(output: string): JsonRecord[] {
  const records: JsonRecord[] = []
  for (const line of output.split("\n")) {
    if (!line.trim()) continue
    try {
      records.push(JSON.parse(line) as JsonRecord)
    } catch {
      // OpenCode --format json should be newline-delimited JSON; ignore non-JSON noise defensively.
    }
  }
  return records
}

function normalizeProjectPath(root: string, filePath: string): string | undefined {
  if (!filePath) return undefined
  const withoutFileProtocol = filePath.replace(/^file:\/\//, "")
  const absolute = path.isAbsolute(withoutFileProtocol) ? withoutFileProtocol : path.join(root, withoutFileProtocol)
  const relative = path.relative(root, absolute).split(path.sep).join("/")
  if (relative.startsWith("..") || path.isAbsolute(relative)) return undefined
  return relative || "."
}

function collectFilePaths(value: unknown, root: string, files: Set<string>): void {
  if (!value) return
  if (typeof value === "string") {
    const normalized = normalizeProjectPath(root, value)
    if (normalized && /\.[a-z0-9]+$/i.test(normalized)) files.add(normalized)
    return
  }
  if (Array.isArray(value)) {
    for (const item of value) collectFilePaths(item, root, files)
    return
  }
  if (typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (/file|path/i.test(key)) collectFilePaths(item, root, files)
      else if (typeof item === "object") collectFilePaths(item, root, files)
    }
  }
}

function parseBashFileReads(command: string, root: string, files: Set<string>): void {
  const matches = command.matchAll(/(?:cat|less|more|head|tail|sed|awk)\s+(?:-[^\s]+\s+)*(['"]?)([^'"\s;&|]+)\1/g)
  for (const match of matches) {
    const normalized = normalizeProjectPath(root, match[2])
    if (normalized && /\.[a-z0-9]+$/i.test(normalized)) files.add(normalized)
  }
}

function formatCost(cost: number): string {
  return cost === 0 ? "0" : cost.toFixed(6)
}

function parseMetrics(output: string, root: string, durationMs: number, cacheContent = ""): Metrics {
  const records = parseJsonLines(output)
  const uniqueFiles = new Set<string>()
  const toolCounts: Record<string, number> = {}
  let deniedFilesAttempted = false
  let inputTokens = 0
  let outputTokens = 0
  let reasoningTokens = 0
  let cacheReadTokens = 0
  let cacheWriteTokens = 0
  let totalTokens = 0
  let cost = 0

  for (const record of records) {
    const part = record.part
    if (!part) continue

    if (part.type === "tool" && part.tool) {
      toolCounts[part.tool] = (toolCounts[part.tool] ?? 0) + 1
      collectFilePaths(part.state?.input, root, uniqueFiles)
      if (part.tool === "bash" && typeof part.state?.input === "object" && part.state.input && "command" in part.state.input) {
        parseBashFileReads(String((part.state.input as { command?: unknown }).command ?? ""), root, uniqueFiles)
      }
    }

    if (part.tokens) {
      inputTokens += part.tokens.input ?? 0
      outputTokens += part.tokens.output ?? 0
      reasoningTokens += part.tokens.reasoning ?? 0
      cacheReadTokens += part.tokens.cache?.read ?? 0
      cacheWriteTokens += part.tokens.cache?.write ?? 0
      totalTokens += part.tokens.total ?? 0
    }
    cost += part.cost ?? 0
  }

  for (const file of uniqueFiles) {
    if (deniedPattern.test(file)) deniedFilesAttempted = true
  }

  return {
    toolCalls: Object.values(toolCounts).reduce((sum, count) => sum + count, 0),
    readCalls: toolCounts.read ?? 0,
    bashCalls: toolCounts.bash ?? 0,
    globCalls: toolCounts.glob ?? 0,
    grepCalls: toolCounts.grep ?? 0,
    uniqueFilesRead: [...uniqueFiles].sort(),
    toolCounts,
    contextGoblinStatus: Boolean(toolCounts.context_goblin_status),
    contextGoblinRefresh: Boolean(toolCounts.context_goblin_refresh),
    contextGoblinRead: Boolean(toolCounts.context_goblin_read),
    cacheSize: Buffer.byteLength(cacheContent),
    cacheLines: cacheContent ? cacheContent.split("\n").length : 0,
    deniedFilesAttempted,
    secretLeakage: cacheContent.includes("super-secret"),
    durationMs,
    inputTokens,
    outputTokens,
    reasoningTokens,
    cacheReadTokens,
    cacheWriteTokens,
    totalTokens,
    cost,
  }
}

function reduction(baseline: number, goblin: number): string {
  if (baseline === 0) return "n/a"
  return `${Math.round(((baseline - goblin) / baseline) * 100)}%`
}

function formatToolCounts(metrics: Metrics): string {
  const entries = Object.entries(metrics.toolCounts).sort(([a], [b]) => a.localeCompare(b))
  if (entries.length === 0) return "- none"
  return entries.map(([tool, count]) => `- ${tool}: ${count}`).join("\n")
}

function formatFileList(files: string[]): string {
  if (files.length === 0) return "- none observed"
  return files.slice(0, 30).map((file) => `- ${file}`).join("\n") + (files.length > 30 ? `\n- ... ${files.length - 30} more` : "")
}

async function opencodeVersion(): Promise<string> {
  try {
    return (await execFileAsync("opencode", ["--version"])).stdout.trim()
  } catch {
    return "not available"
  }
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

  const baselineRun = await runOpenCode(baselineRoot, baselinePrompt, { isolatedConfig: true })
  await fs.mkdir("benchmark-results", { recursive: true })
  await fs.writeFile("benchmark-results/baseline-events.jsonl", baselineRun.output)
  const goblinRun = await runOpenCode(goblinRoot, goblinPrompt, { isolatedConfig: false })
  await fs.writeFile("benchmark-results/goblin-events.jsonl", goblinRun.output)
  const cachePath = path.join(goblinRoot, CACHE_MARKDOWN)
  const cacheContent = (await exists(cachePath)) ? await fs.readFile(cachePath, "utf8") : ""
  const baseline = parseMetrics(baselineRun.output, baselineRoot, baselineRun.durationMs)
  const goblin = parseMetrics(goblinRun.output, goblinRoot, goblinRun.durationMs, cacheContent)
  const fileReadPass = baseline.uniqueFilesRead.length === 0 ? goblin.contextGoblinRead : goblin.uniqueFilesRead.length < baseline.uniqueFilesRead.length
  const pass = baselineRun.ok && goblinRun.ok && cacheContent.length > 0 && goblin.contextGoblinRead && fileReadPass && !goblin.deniedFilesAttempted && goblin.cacheSize <= 25 * 1024 && !goblin.secretLeakage

  const report = `# Context Goblin Benchmark Report

Generated: ${new Date().toISOString()}
OpenCode version: ${await opencodeVersion()}
Node version: ${process.version}
Plugin version: ${packageJson.version}

## Fixture

- Name: large-repo
- Source files: 300
- Secret files: yes
- Generated folders: node_modules, dist, coverage

## Method

- Baseline command: \`OPENCODE_CONFIG_DIR=<empty-config> opencode run --auto --format json --dir <fixture> <prompt>\`
- Context Goblin command: \`opencode run --auto --format json --dir <fixture> <prompt>\`
- Baseline uses an isolated empty OpenCode config directory so globally installed Context Goblin cannot affect the control run.
- Token and cost metrics are summed from OpenCode JSON \`step_finish.part.tokens\` and \`step_finish.part.cost\` events.
- File-read metrics are inferred from explicit tool inputs and common shell file-read commands. They are directional evidence, not a provider billing source of truth.

## Run Status

- Baseline completed: ${baselineRun.ok}
- Context Goblin completed: ${goblinRun.ok}
- Baseline error: ${baselineRun.error ? "see Diagnostics" : "none"}
- Context Goblin error: ${goblinRun.error ? "see Diagnostics" : "none"}

## Baseline

- Tool calls: ${baseline.toolCalls}
- Built-in read calls: ${baseline.readCalls}
- Bash calls: ${baseline.bashCalls}
- Glob calls: ${baseline.globCalls}
- Grep calls: ${baseline.grepCalls}
- Unique files read: ${baseline.uniqueFilesRead.length}
- Input tokens: ${baseline.inputTokens}
- Output tokens: ${baseline.outputTokens}
- Reasoning tokens: ${baseline.reasoningTokens}
- Cache read tokens: ${baseline.cacheReadTokens}
- Cache write tokens: ${baseline.cacheWriteTokens}
- Total event tokens: ${baseline.totalTokens}
- Cost: ${formatCost(baseline.cost)}
- Duration: ${baseline.durationMs}ms

### Baseline Tool Counts

${formatToolCounts(baseline)}

### Baseline Files Read

${formatFileList(baseline.uniqueFilesRead)}

## Context Goblin

- Tool calls: ${goblin.toolCalls}
- Built-in read calls: ${goblin.readCalls}
- Bash calls: ${goblin.bashCalls}
- Glob calls: ${goblin.globCalls}
- Grep calls: ${goblin.grepCalls}
- Unique files read: ${goblin.uniqueFilesRead.length}
- context_goblin_status called: ${goblin.contextGoblinStatus}
- context_goblin_refresh called: ${goblin.contextGoblinRefresh}
- context_goblin_read called: ${goblin.contextGoblinRead}
- Cache size: ${goblin.cacheSize} bytes
- Cache line count: ${goblin.cacheLines}
- Input tokens: ${goblin.inputTokens}
- Output tokens: ${goblin.outputTokens}
- Reasoning tokens: ${goblin.reasoningTokens}
- Cache read tokens: ${goblin.cacheReadTokens}
- Cache write tokens: ${goblin.cacheWriteTokens}
- Total event tokens: ${goblin.totalTokens}
- Cost: ${formatCost(goblin.cost)}
- Duration: ${goblin.durationMs}ms

### Context Goblin Tool Counts

${formatToolCounts(goblin)}

### Context Goblin Files Read

${formatFileList(goblin.uniqueFilesRead)}

## Result

- File-read reduction: ${reduction(baseline.uniqueFilesRead.length, goblin.uniqueFilesRead.length)}
- Tool-call reduction: ${reduction(baseline.toolCalls, goblin.toolCalls)}
- Input-token change: ${reduction(baseline.inputTokens, goblin.inputTokens)}
- Total-token change: ${reduction(baseline.totalTokens, goblin.totalTokens)}
- Secret leakage: ${goblin.secretLeakage ? "fail" : "pass"}
- Denied files attempted: ${goblin.deniedFilesAttempted ? "fail" : "pass"}
- Cache size check: ${goblin.cacheSize <= 25 * 1024 ? "pass" : "fail"}
- Pass/fail: ${pass ? "pass" : "fail"}

## Interpretation

- Passing means Context Goblin loaded, created a compact safe cache, and the agent used \`context_goblin_read\` in the real OpenCode run.
- Token and cost numbers can vary by model, provider, and cache state. They are reported as evidence, not hard release gates.
- The hard release gates are tool usage, cache creation, cache size, denied-file avoidance, and zero secret leakage.

## Diagnostics

### Baseline Error

\`\`\`txt
${baselineRun.error ?? "none"}
\`\`\`

### Context Goblin Error

\`\`\`txt
${goblinRun.error ?? "none"}
\`\`\`
`

  await fs.writeFile("benchmark-results/context-goblin-benchmark.md", report)
  console.log(report)
  if (!pass) process.exitCode = 1
}

await main()
