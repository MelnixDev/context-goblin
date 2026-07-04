#!/usr/bin/env bash
set -euo pipefail

if ! command -v opencode >/dev/null 2>&1; then
  echo "opencode CLI not found"
  exit 1
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
model="${OPENCODE_MODEL:-openai/gpt-5.5}"
report_path="$repo_root/examples/gpt-5.5-cache-vs-no-cache.md"
baseline_raw="$repo_root/examples/gpt-5.5-cache-vs-no-cache.baseline.events.jsonl"
goblin_raw="$repo_root/examples/gpt-5.5-cache-vs-no-cache.goblin.events.jsonl"

npm run build

tmpdir="$(mktemp -d)"
baseline_dir="$tmpdir/baseline"
goblin_dir="$tmpdir/goblin"
mkdir -p "$baseline_dir/src" "$goblin_dir/src" "$goblin_dir/.opencode/plugins" "$repo_root/examples"

create_fixture() {
  local root="$1"
  cat > "$root/package.json" <<'JSON'
{
  "name": "context-goblin-ab-fixture",
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
  printf 'API_KEY=super-secret-ab-check\nPASSWORD=super-secret-password\n' > "$root/.env"
}

create_fixture "$baseline_dir"
create_fixture "$goblin_dir"

cat > "$goblin_dir/.opencode/plugins/context-goblin.js" <<EOF
export { default, ContextGoblin } from "file://$repo_root/dist/src/index.js"
EOF

baseline_prompt='No Context Goblin is available in this baseline run. Read package.json, tsconfig.json, vite.config.ts, src/main.tsx, and src/App.tsx using normal OpenCode tools. Then answer in one concise paragraph with stack, package manager, commands, entry point, safety exclusions you would apply, and smallest files to inspect next. Do not modify files and do not read .env.'
goblin_prompt='Call context_goblin_status. If missing or stale, call context_goblin_refresh. Then call context_goblin_read. Final answer: one concise paragraph with stack, package manager, commands, entry point, safety exclusions, and smallest files to inspect next. Do not modify files.'

run_opencode() {
  local root="$1"
  local prompt="$2"
  local output="$3"
  local stderr_file="$4"
  local started ended exit_code
  started="$(date +%s)"
  set +e
  opencode run --model "$model" --auto --format json --dir "$root" "$prompt" > "$output" 2> "$stderr_file"
  exit_code="$?"
  set -e
  ended="$(date +%s)"
  printf '%s:%s\n' "$exit_code" "$(( (ended - started) * 1000 ))"
}

baseline_result="$(run_opencode "$baseline_dir" "$baseline_prompt" "$baseline_raw" "$tmpdir/baseline.stderr")"
goblin_result="$(run_opencode "$goblin_dir" "$goblin_prompt" "$goblin_raw" "$tmpdir/goblin.stderr")"

BASELINE_EXIT_CODE="${baseline_result%%:*}" \
BASELINE_DURATION_MS="${baseline_result##*:}" \
GOBLIN_EXIT_CODE="${goblin_result%%:*}" \
GOBLIN_DURATION_MS="${goblin_result##*:}" \
OPENCODE_MODEL_USED="$model" \
OPENCODE_VERSION="$(opencode --version 2>/dev/null || printf 'not available')" \
BASELINE_PROMPT="$baseline_prompt" \
GOBLIN_PROMPT="$goblin_prompt" \
REPO_ROOT="$repo_root" \
BASELINE_ROOT="$baseline_dir" \
GOBLIN_ROOT="$goblin_dir" \
BASELINE_RAW="$baseline_raw" \
GOBLIN_RAW="$goblin_raw" \
BASELINE_STDERR="$tmpdir/baseline.stderr" \
GOBLIN_STDERR="$tmpdir/goblin.stderr" \
REPORT_PATH="$report_path" \
node <<'NODE'
const fs = require("node:fs")
const path = require("node:path")

const repoRoot = process.env.REPO_ROOT
const baselineRoot = fs.realpathSync(process.env.BASELINE_ROOT)
const goblinRoot = fs.realpathSync(process.env.GOBLIN_ROOT)
const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"))

function parseEvents(filePath, root) {
  const raw = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : ""
  const toolCounts = {}
  const files = new Set()
  const textParts = []
  let inputTokens = 0
  let outputTokens = 0
  let reasoningTokens = 0
  let cacheReadTokens = 0
  let cacheWriteTokens = 0
  let totalTokens = 0
  let cost = 0

  for (const line of raw.split("\n")) {
    if (!line.trim()) continue
    try {
      const record = JSON.parse(line)
      const part = record.part
      if (!part) continue
      if (part.type === "tool" && part.tool) {
        toolCounts[part.tool] = (toolCounts[part.tool] || 0) + 1
        collectFiles(part.state?.input, root, files)
        if (part.tool === "bash" && part.state?.input?.command) parseBashFiles(String(part.state.input.command), root, files)
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

  return { raw, toolCounts, files: [...files].sort(), text: textParts.at(-1) || "", inputTokens, outputTokens, reasoningTokens, cacheReadTokens, cacheWriteTokens, totalTokens, cost }
}

function normalizeFile(root, value) {
  if (!value || typeof value !== "string") return undefined
  const withoutProtocol = value.replace(/^file:\/\//, "")
  const rawAbsolute = path.isAbsolute(withoutProtocol) ? withoutProtocol : path.join(root, withoutProtocol)
  const absolute = fs.existsSync(rawAbsolute) ? fs.realpathSync(rawAbsolute) : rawAbsolute
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

function parseBashFiles(command, root, files) {
  const matches = command.matchAll(/(?:cat|less|more|head|tail|sed|awk)\s+(?:-[^\s]+\s+)*(['"]?)([^'"\s;&|]+)\1/g)
  for (const match of matches) {
    const file = normalizeFile(root, match[2])
    if (file) files.add(file)
  }
}

function sanitize(value) {
  return String(value || "")
    .replaceAll(baselineRoot, "<baseline-fixture>")
    .replaceAll(goblinRoot, "<goblin-fixture>")
    .replaceAll(repoRoot, "<repo>")
    .replace(/super-secret[-\w]*/g, "[REDACTED]")
    .replace(/(API_KEY|PASSWORD|TOKEN|SECRET|PRIVATE_KEY)=([^\s\n]+)/g, "$1=[REDACTED]")
}

function yesNo(value) { return value ? "yes" : "no" }
function cost(value) { return value === 0 ? "0" : value.toFixed(6) }
function reduction(before, after) {
  if (!before) return "n/a"
  return `${Math.round(((before - after) / before) * 100)}%`
}
function toolMarkdown(metrics) {
  const entries = Object.entries(metrics.toolCounts).sort(([a], [b]) => a.localeCompare(b))
  return entries.length ? entries.map(([tool, count]) => `- ${tool}: ${count}`).join("\n") : "- none"
}
function filesMarkdown(files) {
  return files.length ? files.map((file) => `- ${file}`).join("\n") : "- none observed"
}

const baseline = parseEvents(process.env.BASELINE_RAW, baselineRoot)
const goblin = parseEvents(process.env.GOBLIN_RAW, goblinRoot)
const cachePath = path.join(goblinRoot, ".opencode/cache/context-goblin/project-context.md")
const statePath = path.join(goblinRoot, ".opencode/cache/context-goblin/project-context.state.json")
const cache = fs.existsSync(cachePath) ? fs.readFileSync(cachePath, "utf8") : ""
const cacheSize = Buffer.byteLength(cache)
const cacheLines = cache ? cache.split("\n").length : 0
const secretLeakage = cache.includes("super-secret") || /(?:API_KEY|PASSWORD|TOKEN|SECRET|PRIVATE_KEY)=([^\[]\S+)/.test(cache)
const baselineExit = Number(process.env.BASELINE_EXIT_CODE || 1)
const goblinExit = Number(process.env.GOBLIN_EXIT_CODE || 1)
const goblinPassed = goblinExit === 0 && goblin.toolCounts.context_goblin_status && goblin.toolCounts.context_goblin_refresh && goblin.toolCounts.context_goblin_read && fs.existsSync(cachePath) && fs.existsSync(statePath) && cache.includes("React") && cache.includes("Vite") && cache.includes("TypeScript") && cache.includes("src/main.tsx") && !secretLeakage && cacheSize <= 25 * 1024
const baselineCompleted = baselineExit === 0
const fileReduction = reduction(baseline.files.length, goblin.files.length)
const tokenReduction = reduction(baseline.inputTokens, goblin.inputTokens)

const report = `# GPT-5.5 Context Goblin Cache vs No Cache

Generated: ${new Date().toISOString()}
Model: ${process.env.OPENCODE_MODEL_USED}
OpenCode version: ${process.env.OPENCODE_VERSION}
Context Goblin version: ${packageJson.version}

## Fixture

- Type: synthetic React/Vite/TypeScript project
- Secret files: yes, fake only
- Entry point: src/main.tsx
- Baseline: no Context Goblin plugin
- Context Goblin: project-local plugin shim enabled

## Prompts

### Baseline

\`\`\`txt
${process.env.BASELINE_PROMPT}
\`\`\`

### Context Goblin

\`\`\`txt
${process.env.GOBLIN_PROMPT}
\`\`\`

## Run Status

- Baseline completed: ${baselineCompleted}
- Context Goblin completed: ${goblinExit === 0}
- Context Goblin validation: ${goblinPassed ? "pass" : "fail"}

## Baseline: No Cache

- Duration: ${process.env.BASELINE_DURATION_MS}ms
- Tool calls: ${Object.values(baseline.toolCounts).reduce((a, b) => a + b, 0)}
- Unique files read: ${baseline.files.length}
- Input tokens: ${baseline.inputTokens}
- Output tokens: ${baseline.outputTokens}
- Reasoning tokens: ${baseline.reasoningTokens}
- Cache read tokens: ${baseline.cacheReadTokens}
- Cache write tokens: ${baseline.cacheWriteTokens}
- Total event tokens: ${baseline.totalTokens}
- Cost: ${cost(baseline.cost)}

### Baseline Tool Counts

${toolMarkdown(baseline)}

### Baseline Files Read

${filesMarkdown(baseline.files)}

### Baseline Final Answer

\`\`\`txt
${sanitize(baseline.text || "No final text captured.")}
\`\`\`

## Context Goblin: Cache First

- Duration: ${process.env.GOBLIN_DURATION_MS}ms
- Tool calls: ${Object.values(goblin.toolCounts).reduce((a, b) => a + b, 0)}
- Unique files read through built-in tools: ${goblin.files.length}
- context_goblin_status called: ${yesNo(Boolean(goblin.toolCounts.context_goblin_status))}
- context_goblin_refresh called: ${yesNo(Boolean(goblin.toolCounts.context_goblin_refresh))}
- context_goblin_read called: ${yesNo(Boolean(goblin.toolCounts.context_goblin_read))}
- Cache markdown exists: ${yesNo(fs.existsSync(cachePath))}
- State JSON exists: ${yesNo(fs.existsSync(statePath))}
- Cache size: ${cacheSize} bytes
- Cache lines: ${cacheLines}
- Secret leakage: ${secretLeakage ? "detected" : "none detected"}
- Input tokens: ${goblin.inputTokens}
- Output tokens: ${goblin.outputTokens}
- Reasoning tokens: ${goblin.reasoningTokens}
- Cache read tokens: ${goblin.cacheReadTokens}
- Cache write tokens: ${goblin.cacheWriteTokens}
- Total event tokens: ${goblin.totalTokens}
- Cost: ${cost(goblin.cost)}

### Context Goblin Tool Counts

${toolMarkdown(goblin)}

### Context Goblin Files Read

${filesMarkdown(goblin.files)}

### Context Goblin Final Answer

\`\`\`txt
${sanitize(goblin.text || "No final text captured.")}
\`\`\`

## Comparison

- File-read reduction: ${fileReduction}
- Input-token change: ${tokenReduction}
- Baseline read files directly: ${yesNo(baseline.files.length > 0)}
- Context Goblin started from cache: ${yesNo(Boolean(goblin.toolCounts.context_goblin_read))}
- Cache stayed <= 25 KB: ${yesNo(cacheSize <= 25 * 1024)}
- Secret leakage: ${secretLeakage ? "fail" : "pass"}

## Result

Pass/fail: ${baselineCompleted && goblinPassed ? "pass" : "fail"}

Conclusion: ${baselineCompleted && goblinPassed ? "GPT-5.5 completed both runs. The baseline inspected project files directly; Context Goblin used status, refresh, and read to start from a compact safe cache." : "One side did not fully pass. See run status and diagnostics."}

## Diagnostics

### Baseline stderr

\`\`\`txt
${sanitize(fs.existsSync(process.env.BASELINE_STDERR) ? fs.readFileSync(process.env.BASELINE_STDERR, "utf8") : "none") || "none"}
\`\`\`

### Context Goblin stderr

\`\`\`txt
${sanitize(fs.existsSync(process.env.GOBLIN_STDERR) ? fs.readFileSync(process.env.GOBLIN_STDERR, "utf8") : "none") || "none"}
\`\`\`
`

fs.writeFileSync(process.env.REPORT_PATH, report)
console.log(report)
process.exit(baselineCompleted && goblinPassed ? 0 : 1)
NODE
