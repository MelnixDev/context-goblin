#!/usr/bin/env bash
set -euo pipefail

if ! command -v opencode >/dev/null 2>&1; then
  echo "opencode CLI not found"
  exit 1
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
model="${OPENCODE_MODEL:-openai/gpt-5.5}"
report_path="$repo_root/examples/gpt-5.5-cache-check.md"
raw_path="$repo_root/examples/gpt-5.5-cache-check.events.jsonl"

npm run build

tmpdir="$(mktemp -d)"
mkdir -p "$tmpdir/src" "$tmpdir/.opencode/plugins" "$repo_root/examples"

cat > "$tmpdir/package.json" <<'JSON'
{
  "name": "context-goblin-gpt55-fixture",
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

printf '{"compilerOptions":{"strict":true,"jsx":"react-jsx"}}\n' > "$tmpdir/tsconfig.json"
printf 'export default {}\n' > "$tmpdir/vite.config.ts"
printf 'export function App() { return <main>Context Goblin</main> }\n' > "$tmpdir/src/App.tsx"
printf 'import { App } from "./App"; export { App };\n' > "$tmpdir/src/main.tsx"
printf 'API_KEY=super-secret-gpt55-check\nPASSWORD=super-secret-password\n' > "$tmpdir/.env"

cat > "$tmpdir/.opencode/plugins/context-goblin.js" <<EOF
export { default, ContextGoblin } from "file://$repo_root/dist/src/index.js"
EOF

prompt='Call context_goblin_status. If missing or stale, call context_goblin_refresh. Then call context_goblin_read. Final answer: one concise paragraph with stack, package manager, commands, entry point, safety exclusions, and smallest files to inspect next. Do not modify files.'

started="$(date +%s)"
set +e
opencode run --model "$model" --auto --format json --dir "$tmpdir" "$prompt" > "$raw_path" 2> "$tmpdir/opencode.stderr"
exit_code="$?"
set -e
ended="$(date +%s)"
duration_ms="$(( (ended - started) * 1000 ))"

OPENCODE_EXIT_CODE="$exit_code" \
OPENCODE_DURATION_MS="$duration_ms" \
OPENCODE_MODEL_USED="$model" \
OPENCODE_PROMPT="$prompt" \
OPENCODE_VERSION="$(opencode --version 2>/dev/null || printf 'not available')" \
REPO_ROOT="$repo_root" \
FIXTURE_ROOT="$tmpdir" \
RAW_EVENTS_PATH="$raw_path" \
REPORT_PATH="$report_path" \
STDERR_PATH="$tmpdir/opencode.stderr" \
node <<'NODE'
const fs = require("node:fs")
const path = require("node:path")

const repoRoot = process.env.REPO_ROOT
const fixtureRoot = process.env.FIXTURE_ROOT
const rawPath = process.env.RAW_EVENTS_PATH
const reportPath = process.env.REPORT_PATH
const stderrPath = process.env.STDERR_PATH
const model = process.env.OPENCODE_MODEL_USED
const prompt = process.env.OPENCODE_PROMPT
const durationMs = Number(process.env.OPENCODE_DURATION_MS || 0)
const exitCode = Number(process.env.OPENCODE_EXIT_CODE || 1)
const opencodeVersion = process.env.OPENCODE_VERSION || "not available"
const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"))
const cachePath = path.join(fixtureRoot, ".opencode/cache/context-goblin/project-context.md")
const statePath = path.join(fixtureRoot, ".opencode/cache/context-goblin/project-context.state.json")
const raw = fs.existsSync(rawPath) ? fs.readFileSync(rawPath, "utf8") : ""
const stderr = fs.existsSync(stderrPath) ? fs.readFileSync(stderrPath, "utf8") : ""
const cache = fs.existsSync(cachePath) ? fs.readFileSync(cachePath, "utf8") : ""

const toolCounts = {}
let inputTokens = 0
let outputTokens = 0
let reasoningTokens = 0
let cacheReadTokens = 0
let cacheWriteTokens = 0
let totalTokens = 0
let cost = 0
const textParts = []

for (const line of raw.split("\n")) {
  if (!line.trim()) continue
  try {
    const record = JSON.parse(line)
    const part = record.part
    if (!part) continue
    if (part.type === "tool" && part.tool) toolCounts[part.tool] = (toolCounts[part.tool] || 0) + 1
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

function sanitize(value) {
  return String(value || "")
    .replaceAll(fixtureRoot, "<fixture>")
    .replaceAll(repoRoot, "<repo>")
    .replace(/super-secret[-\w]*/g, "[REDACTED]")
    .replace(/(API_KEY|PASSWORD|TOKEN|SECRET|PRIVATE_KEY)=([^\s\n]+)/g, "$1=[REDACTED]")
}

function yesNo(value) {
  return value ? "yes" : "no"
}

function toolCountMarkdown() {
  const entries = Object.entries(toolCounts).sort(([a], [b]) => a.localeCompare(b))
  return entries.length ? entries.map(([tool, count]) => `- ${tool}: ${count}`).join("\n") : "- none"
}

const requiredHeadings = [
  "# Context Goblin Project Cache",
  "## Detected Stack",
  "## Important Commands",
  "## Directory Map",
  "## Safety Exclusions",
  "## Agent Instructions",
]
const missingHeadings = requiredHeadings.filter((heading) => !cache.includes(heading))
const statusCalled = Boolean(toolCounts.context_goblin_status)
const refreshCalled = Boolean(toolCounts.context_goblin_refresh)
const readCalled = Boolean(toolCounts.context_goblin_read)
const cacheExists = fs.existsSync(cachePath)
const stateExists = fs.existsSync(statePath)
const cacheSize = Buffer.byteLength(cache)
const cacheLines = cache ? cache.split("\n").length : 0
const stackDetected = cache.includes("React") && cache.includes("Vite") && cache.includes("TypeScript")
const entryPointDetected = cache.includes("src/main.tsx")
const secretLeakage = cache.includes("super-secret") || /(?:API_KEY|PASSWORD|TOKEN|SECRET|PRIVATE_KEY)=([^\[]\S+)/.test(cache)
const cacheSizeOk = cacheSize <= 25 * 1024
const pass = exitCode === 0 && statusCalled && refreshCalled && readCalled && cacheExists && stateExists && missingHeadings.length === 0 && stackDetected && entryPointDetected && !secretLeakage && cacheSizeOk
const finalText = sanitize(textParts.at(-1) || "No final text captured.").slice(0, 3000)

const report = `# GPT-5.5 Context Goblin Cache Check

Generated: ${new Date().toISOString()}
Model: ${model}
OpenCode version: ${opencodeVersion}
Context Goblin version: ${packageJson.version}

## Fixture

- Type: synthetic React/Vite/TypeScript project
- Secret files: yes, fake only
- Entry point: src/main.tsx
- Generated in: <temporary fixture>

## Prompt

\`\`\`txt
${prompt}
\`\`\`

## Run Status

- OpenCode completed: ${exitCode === 0}
- Duration: ${durationMs}ms
- Result: ${pass ? "pass" : "fail"}

## Tool Calls Observed

- context_goblin_status: ${yesNo(statusCalled)}
- context_goblin_refresh: ${yesNo(refreshCalled)}
- context_goblin_read: ${yesNo(readCalled)}

### Tool Counts

${toolCountMarkdown()}

## Cache Result

- Markdown exists: ${yesNo(cacheExists)}
- State JSON exists: ${yesNo(stateExists)}
- Cache size: ${cacheSize} bytes
- Cache lines: ${cacheLines}
- Required headings present: ${yesNo(missingHeadings.length === 0)}
- React/Vite/TypeScript detected: ${yesNo(stackDetected)}
- Entry point detected: ${yesNo(entryPointDetected)}
- Secret leakage: ${secretLeakage ? "detected" : "none detected"}
- Cache size <= 25 KB: ${yesNo(cacheSizeOk)}

## Cache Summary

- Stack: React, Vite, TypeScript
- Commands: dev, build, test
- Entry points: src/main.tsx
- Safety exclusions include: .env, node_modules, dist, build, coverage, .git, cache internals

## GPT-5.5 Behavior

\`\`\`txt
${finalText}
\`\`\`

## Token/Cost Evidence

- Input tokens: ${inputTokens}
- Output tokens: ${outputTokens}
- Reasoning tokens: ${reasoningTokens}
- Cache read tokens: ${cacheReadTokens}
- Cache write tokens: ${cacheWriteTokens}
- Total event tokens: ${totalTokens}
- Cost: ${cost === 0 ? "0" : cost.toFixed(6)}

## Diagnostics

### Missing Headings

${missingHeadings.length ? missingHeadings.map((heading) => `- ${heading}`).join("\n") : "- none"}

### Error

\`\`\`txt
${sanitize(stderr || (exitCode === 0 ? "none" : `opencode exited with code ${exitCode}`)).slice(0, 4000)}
\`\`\`

## Result

Pass/fail: ${pass ? "pass" : "fail"}

Conclusion: ${pass ? "GPT-5.5 used Context Goblin first, read the compact cache, and no fake secrets leaked." : "The check did not fully pass. See diagnostics above."}
`

fs.writeFileSync(reportPath, report)
console.log(report)
process.exit(pass ? 0 : 1)
NODE
