#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
opencode_bin="${OPENCODE_BIN:-$repo_root/node_modules/.bin/opencode}"
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

mkdir -p "$tmpdir/src" "$tmpdir/.opencode/plugins"
printf '{"scripts":{"test":"vitest"},"dependencies":{"react":"latest"}}\n' > "$tmpdir/package.json"
printf '{"compilerOptions":{"strict":true}}\n' > "$tmpdir/tsconfig.json"
printf 'export function App() { return null }\n' > "$tmpdir/src/App.tsx"
printf 'export const hello = "world";\n' > "$tmpdir/src/index.ts"
printf 'API_KEY=super-secret-value\n' > "$tmpdir/.env"
mkdir -p "$tmpdir/xdg" "$tmpdir/data" "$tmpdir/state" "$tmpdir/cache"

cat > "$tmpdir/.opencode/plugins/context-goblin.js" <<EOF
export { default } from "file://$repo_root/dist/src/index.js"
EOF

cat > "$tmpdir/opencode.json" <<'EOF'
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["./.opencode/plugins/context-goblin.js"]
}
EOF

TMPDIR_UNDER_TEST="$tmpdir" node --input-type=module <<'NODE'
import fs from "node:fs/promises"
import path from "node:path"

import { cacheStatus, generateProjectContext } from "./dist/src/index.js"

const root = process.env.TMPDIR_UNDER_TEST
await generateProjectContext({ rootDir: root })
const status = await cacheStatus(root)
const cachePath = path.join(root, ".opencode/cache/context-goblin/project-context.md")
const statePath = path.join(root, ".opencode/cache/context-goblin/project-context.state.json")
const cache = await fs.readFile(cachePath, "utf8")
const state = JSON.parse(await fs.readFile(statePath, "utf8"))
await fs.access(statePath)

if (!status.exists || status.stale || status.reason !== "fresh") {
  throw new Error(`Expected fresh cache, got ${JSON.stringify(status)}`)
}
if (!cache.includes("## Code Map")) throw new Error("Expected Code Map in generated cache")
if (!cache.includes("src/App.tsx")) throw new Error("Expected source file in generated cache")
if (cache.includes("super-secret-value")) throw new Error("Secret leaked into generated cache")
if (!state.stats || state.stats.cacheBytes <= 0 || state.stats.codeMapFiles <= 0) {
  throw new Error(`Expected cache stats in state, got ${JSON.stringify(state)}`)
}
NODE

resolved_config="$({
  cd "$tmpdir"
  XDG_CONFIG_HOME="$tmpdir/xdg" \
    XDG_DATA_HOME="$tmpdir/data" \
    XDG_STATE_HOME="$tmpdir/state" \
    XDG_CACHE_HOME="$tmpdir/cache" \
    OPENCODE_DISABLE_DEFAULT_PLUGINS=1 \
    OPENCODE_DISABLE_MODELS_FETCH=1 \
    OPENCODE_TIMEOUT_MS="${OPENCODE_TIMEOUT_MS:-60000}" \
    node "$repo_root/scripts/run-opencode.mjs" "$opencode_bin" debug config --print-logs --log-level INFO
})"

RESOLVED_CONFIG="$resolved_config" node --input-type=module <<'NODE'
const config = JSON.parse(process.env.RESOLVED_CONFIG)
for (const name of ["context-goblin-stats", "context-goblin-usage"]) {
  if (!config.command?.[name]) throw new Error(`OpenCode did not register ${name}`)
}
NODE

echo "Context Goblin smoke test passed"
