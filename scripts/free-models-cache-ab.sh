#!/usr/bin/env bash
set -euo pipefail

if ! command -v opencode >/dev/null 2>&1; then
  echo "opencode CLI not found"
  exit 1
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
models="${OPENCODE_MODELS:-opencode/deepseek-v4-flash-free opencode/mimo-v2.5-free opencode/nemotron-3-ultra-free opencode/north-mini-code-free}"
report_path="$repo_root/examples/free-models-cache-ab.md"
metadata_path="$repo_root/examples/free-models-cache-ab.metadata.tsv"

npm run build
mkdir -p "$repo_root/examples"
: > "$metadata_path"

create_fixture() {
  local root="$1"
  mkdir -p "$root/src"
  cat > "$root/package.json" <<'JSON'
{
  "name": "context-goblin-free-model-fixture",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest"
  },
  "dependencies": {
    "@vitejs/plugin-react": "latest",
    "vite": "latest",
    "react": "latest",
    "react-dom": "latest"
  }
}
JSON
  printf '{"compilerOptions":{"strict":true,"jsx":"react-jsx"}}\n' > "$root/tsconfig.json"
  printf 'export default {}\n' > "$root/vite.config.ts"
  printf 'export function App() { return <main>Context Goblin</main> }\n' > "$root/src/App.tsx"
  printf 'import { App } from "./App"; export { App };\n' > "$root/src/main.tsx"
  printf 'API_KEY=super-secret-free-model-check\nPASSWORD=super-secret-password\n' > "$root/.env"
}

run_opencode() {
  local model="$1"
  local root="$2"
  local prompt="$3"
  local output="$4"
  local stderr_file="$5"
  local started ended exit_code
  started="$(date +%s)"
  set +e
  opencode run --model "$model" --auto --format json --dir "$root" "$prompt" > "$output" 2> "$stderr_file"
  exit_code="$?"
  set -e
  ended="$(date +%s)"
  printf '%s:%s\n' "$exit_code" "$(( (ended - started) * 1000 ))"
}

safe_name() {
  printf '%s' "$1" | tr '/:' '--' | tr -cd '[:alnum:]._-'
}

baseline_prompt='No Context Goblin is available in this baseline run. Read package.json, tsconfig.json, vite.config.ts, src/main.tsx, and src/App.tsx using normal OpenCode tools. Then answer in one concise paragraph with stack, package manager, commands, entry point, safety exclusions you would apply, and smallest files to inspect next. Do not modify files and do not read .env.'
goblin_prompt='Call context_goblin_status. If missing or stale, call context_goblin_refresh. Then call context_goblin_read. Final answer: one concise paragraph with stack, package manager, commands, entry point, safety exclusions, and smallest files to inspect next. Do not modify files.'

for model in $models; do
  name="$(safe_name "$model")"
  tmpdir="$(mktemp -d)"
  baseline_dir="$tmpdir/baseline"
  goblin_dir="$tmpdir/goblin"
  mkdir -p "$baseline_dir" "$goblin_dir/.opencode/plugins"
  create_fixture "$baseline_dir"
  create_fixture "$goblin_dir"
  cat > "$goblin_dir/.opencode/plugins/context-goblin.js" <<EOF
export { default, ContextGoblin } from "file://$repo_root/dist/src/index.js"
EOF

  baseline_raw="$repo_root/examples/free-models-cache-ab.$name.baseline.events.jsonl"
  goblin_raw="$repo_root/examples/free-models-cache-ab.$name.goblin.events.jsonl"
  baseline_stderr="$tmpdir/baseline.stderr"
  goblin_stderr="$tmpdir/goblin.stderr"

  echo "Running baseline: $model"
  baseline_result="$(run_opencode "$model" "$baseline_dir" "$baseline_prompt" "$baseline_raw" "$baseline_stderr")"
  echo "Running Context Goblin: $model"
  goblin_result="$(run_opencode "$model" "$goblin_dir" "$goblin_prompt" "$goblin_raw" "$goblin_stderr")"

  printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' \
    "$model" "$baseline_dir" "$goblin_dir" "$baseline_raw" "$goblin_raw" \
    "$baseline_stderr" "$goblin_stderr" "${baseline_result%%:*}" "${baseline_result##*:}" \
    "${goblin_result%%:*}" "${goblin_result##*:}" "$name" >> "$metadata_path"
done

OPENCODE_VERSION="$(opencode --version 2>/dev/null || printf 'not available')" \
REPO_ROOT="$repo_root" \
METADATA_PATH="$metadata_path" \
REPORT_PATH="$report_path" \
BASELINE_PROMPT="$baseline_prompt" \
GOBLIN_PROMPT="$goblin_prompt" \
node <<'NODE'
const fs = require("node:fs")
const path = require("node:path")

const repoRoot = process.env.REPO_ROOT
const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"))
const rows = fs.readFileSync(process.env.METADATA_PATH, "utf8").trim().split("\n").filter(Boolean).map((line) => {
  const [model, baselineRoot, goblinRoot, baselineRaw, goblinRaw, baselineStderr, goblinStderr, baselineExit, baselineDuration, goblinExit, goblinDuration, safeName] = line.split("\t")
  return { model, baselineRoot: real(baselineRoot), goblinRoot: real(goblinRoot), baselineRaw, goblinRaw, baselineStderr, goblinStderr, baselineExit: Number(baselineExit), baselineDuration: Number(baselineDuration), goblinExit: Number(goblinExit), goblinDuration: Number(goblinDuration), safeName }
})

function real(value) {
  try { return fs.realpathSync(value) } catch { return value }
}

function parseEvents(filePath, root) {
  const raw = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : ""
  const toolCounts = {}
  const files = new Set()
  const textParts = []
  const errors = []
  let inputTokens = 0, outputTokens = 0, reasoningTokens = 0, cacheReadTokens = 0, cacheWriteTokens = 0, totalTokens = 0, cost = 0
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue
    try {
      const record = JSON.parse(line)
      if (record.type === "error") errors.push(errorSummary(record.error))
      const part = record.part
      if (!part) continue
      if (part.type === "tool" && part.tool) {
        toolCounts[part.tool] = (toolCounts[part.tool] || 0) + 1
        collectFiles(part.state?.input, root, files)
      }
      if (part.type === "text" && part.text) textParts.push(part.text)
      if (part.tokens) {
        inputTokens += part.tokens.input || 0
        outputTokens += part.tokens.output || 0
        reasoningTokens += part.tokens.reasoning || 0
        cacheReadTokens += part.tokens.cache?.read || 0
        cacheWriteTokens += part.tokens.cache?.write || 0
        totalTokens += part.tokens.total || 0
      }
      cost += part.cost || 0
    } catch {}
  }
  return { toolCounts, files: [...files].sort(), text: textParts.at(-1) || "", errors, inputTokens, outputTokens, reasoningTokens, cacheReadTokens, cacheWriteTokens, totalTokens, cost }
}

function errorSummary(error) {
  if (!error) return "Unknown error"
  const data = error.data || {}
  const parts = []
  if (error.name) parts.push(error.name)
  if (data.statusCode) parts.push(`HTTP ${data.statusCode}`)
  if (data.message) parts.push(data.message)
  return parts.join(": ") || String(error)
}

function normalizeFile(root, value) {
  if (!value || typeof value !== "string") return undefined
  const withoutProtocol = value.replace(/^file:\/\//, "")
  const rawAbsolute = path.isAbsolute(withoutProtocol) ? withoutProtocol : path.join(root, withoutProtocol)
  const absolute = fs.existsSync(rawAbsolute) ? real(rawAbsolute) : rawAbsolute
  const relative = path.relative(root, absolute).split(path.sep).join("/")
  if (relative.startsWith("..") || path.isAbsolute(relative)) return undefined
  return /\.[a-z0-9]+$/i.test(relative) ? relative : undefined
}

function collectFiles(value, root, files) {
  if (!value) return
  if (typeof value === "string") {
    const file = normalizeFile(root, value)
    if (file) files.add(file)
    return
  }
  if (Array.isArray(value)) {
    for (const item of value) collectFiles(item, root, files)
    return
  }
  if (typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (/file|path/i.test(key)) collectFiles(item, root, files)
      else if (typeof item === "object") collectFiles(item, root, files)
    }
  }
}

function sanitize(value, row) {
  let text = String(value || "")
  if (row.baselineRoot) text = text.replaceAll(row.baselineRoot, "<baseline-fixture>")
  if (row.goblinRoot) text = text.replaceAll(row.goblinRoot, "<goblin-fixture>")
  return text
    .replaceAll(repoRoot, "<repo>")
    .replace(/https:\/\/opencode\.ai\/workspace\/[^\s)]+\/billing/g, "https://opencode.ai/workspace/<workspace>/billing")
    .replace(/super-secret[-\w]*/g, "[REDACTED]")
    .replace(/(API_KEY|PASSWORD|TOKEN|SECRET|PRIVATE_KEY)=([^\s\n]+)/g, "$1=[REDACTED]")
}

function reduction(before, after) {
  if (!before) return "n/a"
  return `${Math.round(((before - after) / before) * 100)}%`
}
function yn(value) { return value ? "yes" : "no" }
function cost(value) { return value === 0 ? "0" : value.toFixed(6) }
function toolTotal(metrics) { return Object.values(metrics.toolCounts).reduce((a, b) => a + b, 0) }
function toolList(metrics) {
  const entries = Object.entries(metrics.toolCounts).sort(([a], [b]) => a.localeCompare(b))
  return entries.length ? entries.map(([tool, count]) => `- ${tool}: ${count}`).join("\n") : "- none"
}
function fileList(files) { return files.length ? files.map((file) => `- ${file}`).join("\n") : "- none observed" }
function errorList(errors) { return errors.length ? errors.map((error) => `- ${sanitize(error, { baselineRoot: "", goblinRoot: "" })}`).join("\n") : "- none" }

const results = rows.map((row) => {
  const baseline = parseEvents(row.baselineRaw, row.baselineRoot)
  const goblin = parseEvents(row.goblinRaw, row.goblinRoot)
  const cachePath = path.join(row.goblinRoot, ".opencode/cache/context-goblin/project-context.md")
  const statePath = path.join(row.goblinRoot, ".opencode/cache/context-goblin/project-context.state.json")
  const cache = fs.existsSync(cachePath) ? fs.readFileSync(cachePath, "utf8") : ""
  const secretLeakage = cache.includes("super-secret") || /(?:API_KEY|PASSWORD|TOKEN|SECRET|PRIVATE_KEY)=([^\[]\S+)/.test(cache)
  const cacheSize = Buffer.byteLength(cache)
  const baselineError = row.baselineExit !== 0 || baseline.errors.length > 0
  const goblinError = row.goblinExit !== 0 || goblin.errors.length > 0
  const goblinOk = !goblinError && goblin.toolCounts.context_goblin_status && goblin.toolCounts.context_goblin_refresh && goblin.toolCounts.context_goblin_read && fs.existsSync(cachePath) && fs.existsSync(statePath) && !secretLeakage && cacheSize <= 25 * 1024
  const baselineOk = !baselineError
  const result = baselineError || goblinError ? "error" : baselineOk && goblinOk ? "pass" : "fail"
  return { row, baseline, goblin, baselineOk, goblinOk, result, cacheSize, secretLeakage, fileReduction: reduction(baseline.files.length, goblin.files.length), inputReduction: reduction(baseline.inputTokens, goblin.inputTokens) }
})

const summaryRows = results.map(({ row, baseline, goblin, baselineOk, goblinOk, result, cacheSize, secretLeakage, fileReduction, inputReduction }) => `| ${row.model} | ${yn(baselineOk)} | ${yn(goblinOk)} | ${baseline.files.length} | ${goblin.files.length} | ${fileReduction} | ${inputReduction} | ${cacheSize} | ${secretLeakage ? "fail" : "pass"} | ${result} |`).join("\n")

const details = results.map(({ row, baseline, goblin, baselineOk, goblinOk, result, cacheSize, secretLeakage, fileReduction, inputReduction }) => `## ${row.model}

### Summary

- Baseline completed: ${baselineOk}
- Context Goblin completed and validated: ${Boolean(goblinOk)}
- Result: ${result}
- Baseline direct file reads: ${baseline.files.length}
- Context Goblin built-in file reads: ${goblin.files.length}
- File-read reduction: ${fileReduction}
- Input-token reduction: ${inputReduction}
- Cache size: ${cacheSize} bytes
- Secret leakage: ${secretLeakage ? "detected" : "none detected"}
- Baseline errors: ${baseline.errors.length}
- Context Goblin errors: ${goblin.errors.length}

### Baseline

- Duration: ${row.baselineDuration}ms
- Tool calls: ${toolTotal(baseline)}
- Input tokens: ${baseline.inputTokens}
- Output tokens: ${baseline.outputTokens}
- Reasoning tokens: ${baseline.reasoningTokens}
- Cache read tokens: ${baseline.cacheReadTokens}
- Total event tokens: ${baseline.totalTokens}
- Cost: ${cost(baseline.cost)}

Tool counts:

${toolList(baseline)}

Files read:

${fileList(baseline.files)}

Errors:

${errorList(baseline.errors)}

Final answer:

\`\`\`txt
${sanitize(baseline.text || "No final text captured.", row)}
\`\`\`

### Context Goblin

- Duration: ${row.goblinDuration}ms
- Tool calls: ${toolTotal(goblin)}
- context_goblin_status: ${yn(Boolean(goblin.toolCounts.context_goblin_status))}
- context_goblin_refresh: ${yn(Boolean(goblin.toolCounts.context_goblin_refresh))}
- context_goblin_read: ${yn(Boolean(goblin.toolCounts.context_goblin_read))}
- Input tokens: ${goblin.inputTokens}
- Output tokens: ${goblin.outputTokens}
- Reasoning tokens: ${goblin.reasoningTokens}
- Cache read tokens: ${goblin.cacheReadTokens}
- Total event tokens: ${goblin.totalTokens}
- Cost: ${cost(goblin.cost)}

Tool counts:

${toolList(goblin)}

Files read:

${fileList(goblin.files)}

Errors:

${errorList(goblin.errors)}

Final answer:

\`\`\`txt
${sanitize(goblin.text || "No final text captured.", row)}
\`\`\`
`).join("\n")

const report = `# Free Models Context Goblin A/B Report

Generated: ${new Date().toISOString()}
OpenCode version: ${process.env.OPENCODE_VERSION}
Context Goblin version: ${packageJson.version}

## Models

${rows.map((row) => `- ${row.model}`).join("\n")}

## Summary

| Model | Baseline OK | Goblin OK | Baseline Reads | Goblin Reads | File Reduction | Input Token Reduction | Cache Size | Secret Leak | Result |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
${summaryRows}

${details}
`

fs.writeFileSync(process.env.REPORT_PATH, report)
console.log(report)

if (!results.some((result) => result.result === "pass")) process.exit(1)
NODE
