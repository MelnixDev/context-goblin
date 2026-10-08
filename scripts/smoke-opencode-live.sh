#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
opencode_bin="${OPENCODE_BIN:-$repo_root/node_modules/.bin/opencode}"
model="${OPENCODE_MODEL:-openai/gpt-5.5}"

if [ ! -x "$opencode_bin" ]; then
  echo "OpenCode CLI not found at $opencode_bin"
  exit 1
fi

npm run build

tmpdir="$(mktemp -d)"
cleanup() {
  rm -rf "$tmpdir"
}
trap cleanup EXIT

fixture="$tmpdir/project"
events="$tmpdir/events.jsonl"
stderr_file="$tmpdir/opencode.stderr"
xdg_config="$tmpdir/xdg"
mkdir -p "$fixture/src" "$fixture/.opencode/plugins" "$xdg_config"

cat > "$fixture/package.json" <<'JSON'
{
  "name": "context-goblin-live-smoke",
  "private": true,
  "scripts": {
    "build": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "react": "latest"
  }
}
JSON

cat > "$fixture/tsconfig.json" <<'JSON'
{"compilerOptions":{"strict":true,"jsx":"react-jsx"}}
JSON

cat > "$fixture/src/App.tsx" <<'TS'
export function App() { return <main>Context Goblin live smoke</main> }
TS

cat > "$fixture/src/index.ts" <<'TS'
export { App } from "./App"
TS

cat > "$fixture/.env" <<'ENV'
API_KEY=context-goblin-live-smoke-secret
ENV

cat > "$fixture/.opencode/plugins/context-goblin.js" <<EOF
export { ContextGoblin as default } from "file://$repo_root/dist/src/index.js"
EOF

cat > "$fixture/opencode.json" <<'JSON'
{
  "$schema": "https://opencode.ai/config.json",
  "permission": {
    "task": "deny",
    "bash": "deny",
    "edit": "deny"
  }
}
JSON

prompt='Use Context Goblin and no broad repository discovery. Call context_goblin_get exactly once. Do not call separate Context Goblin status, refresh, read, or stats tools. Do not call task, bash, edit, read, glob, or grep. Do not read .env. Finish with exactly LIVE_SMOKE_OK after briefly reporting the project stack.'

set +e
XDG_CONFIG_HOME="$xdg_config" \
  node "$repo_root/scripts/run-opencode.mjs" "$opencode_bin" run --model "$model" --auto --format json --dir "$fixture" "$prompt" > "$events" 2> "$stderr_file"
exit_code="$?"
set -e

EVENTS_PATH="$events" \
STDERR_PATH="$stderr_file" \
FIXTURE_ROOT="$fixture" \
EXPECTED_MODEL="$model" \
node --input-type=module <<'NODE'
import fs from "node:fs"
import path from "node:path"

const eventsPath = process.env.EVENTS_PATH
const stderrPath = process.env.STDERR_PATH
const root = process.env.FIXTURE_ROOT
const records = fs.readFileSync(eventsPath, "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line))
const tools = records.flatMap((record) => record.part?.type === "tool" && record.part.tool ? [record.part.tool] : [])
const finalText = records.flatMap((record) => record.part?.type === "text" && record.part.text ? [record.part.text] : []).at(-1) ?? ""
const errors = records.filter((record) => record.type === "error")
const requiredTools = ["context_goblin_get"]
const forbiddenTools = ["context_goblin_status", "context_goblin_refresh", "context_goblin_read", "context_goblin_stats", "task", "bash", "edit", "read", "glob", "grep"]
const cachePath = path.join(root, ".opencode/cache/context-goblin/project-context.md")
const statePath = path.join(root, ".opencode/cache/context-goblin/project-context.state.json")
const failures = []

for (const tool of requiredTools) {
  if (!tools.includes(tool)) failures.push(`required tool was not called: ${tool}`)
}
if (tools.filter((tool) => tool === "context_goblin_get").length !== 1) failures.push("context_goblin_get must be called exactly once")
for (const tool of forbiddenTools) {
  if (tools.includes(tool)) failures.push(`forbidden broad-discovery tool was called: ${tool}`)
}
if (errors.length) {
  const summaries = errors.map((record) => record.error?.data?.message || record.error?.name || "Unknown error").join("; ")
  failures.push(`OpenCode emitted ${errors.length} error event(s): ${summaries}`)
}
if (!finalText.includes("LIVE_SMOKE_OK")) failures.push("final answer is missing LIVE_SMOKE_OK")
if (!fs.existsSync(cachePath)) failures.push("project-context.md was not created")
if (!fs.existsSync(statePath)) failures.push("project-context.state.json was not created")
if (fs.existsSync(cachePath)) {
  const cache = fs.readFileSync(cachePath, "utf8")
  if (cache.includes("context-goblin-live-smoke-secret")) failures.push("secret leaked into project cache")
  if (Buffer.byteLength(cache) > 25 * 1024) failures.push("project cache exceeds 25 KB")
}

if (failures.length) {
  const stderr = fs.readFileSync(stderrPath, "utf8")
  console.error(failures.map((failure) => `- ${failure}`).join("\n"))
  if (stderr) console.error(`OpenCode stderr:\n${stderr}`)
  process.exit(1)
}

console.log(`Context Goblin live smoke passed on ${process.env.EXPECTED_MODEL}`)
console.log(`Tool sequence: ${tools.join(" -> ")}`)
NODE

if [ "$exit_code" -ne 0 ]; then
  echo "OpenCode exited with code $exit_code"
  cat "$stderr_file"
  exit "$exit_code"
fi
