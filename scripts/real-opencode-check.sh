#!/usr/bin/env bash
set -euo pipefail

if ! command -v opencode >/dev/null 2>&1; then
  echo "opencode CLI not found; skipping real OpenCode check"
  exit 0
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

npm run build

tmpdir="$(mktemp -d)"
cleanup() {
  rm -rf "$tmpdir"
}
trap cleanup EXIT

mkdir -p "$tmpdir/src" "$tmpdir/.opencode/plugins"
cat > "$tmpdir/package.json" <<'JSON'
{
  "name": "context-goblin-real-check-fixture",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc",
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
printf 'export function App() { return null }\n' > "$tmpdir/src/App.tsx"
printf 'import { App } from "./App"; export { App };\n' > "$tmpdir/src/main.tsx"
printf 'API_KEY=super-secret-real-check\nPASSWORD=super-secret-password\n' > "$tmpdir/.env"

cat > "$tmpdir/.opencode/plugins/context-goblin.js" <<EOF
export { default, ContextGoblin } from "file://$repo_root/dist/src/index.js"
EOF

prompt='You are testing Context Goblin.

Rules:
1. Call context_goblin_status first.
2. If the cache is missing or stale, call context_goblin_refresh.
3. Then call context_goblin_read.
4. Do not inspect broad repository files before reading the cache.
5. After reading the cache, summarize detected stack, package manager, commands, entry points, safety exclusions, and the smallest set of files you would inspect next.
6. Do not modify files.'

opencode run --auto --format json --dir "$tmpdir" "$prompt" > "$tmpdir/opencode-real-check.json"

cache="$tmpdir/.opencode/cache/context-goblin/project-context.md"
state="$tmpdir/.opencode/cache/context-goblin/project-context.state.json"
output="$tmpdir/opencode-real-check.json"

test -f "$cache"
test -f "$state"

for tool_name in context_goblin_status context_goblin_refresh context_goblin_read; do
  if ! grep -q "$tool_name" "$output"; then
    echo "Expected $tool_name in OpenCode JSON output"
    echo "Output saved at $output"
    exit 1
  fi
done

for heading in \
  "# Context Goblin Project Cache" \
  "## Detected Stack" \
  "## Important Commands" \
  "## Directory Map" \
  "## Safety Exclusions" \
  "## Agent Instructions"; do
  if ! grep -q "$heading" "$cache"; then
    echo "Expected heading '$heading' in generated cache"
    exit 1
  fi
done

for expected in React Vite TypeScript "src/main.tsx"; do
  if ! grep -q "$expected" "$cache"; then
    echo "Expected '$expected' in generated cache"
    exit 1
  fi
done

if grep -R "super-secret" "$cache" >/dev/null 2>&1; then
  echo "Secret leaked into generated cache"
  exit 1
fi

cache_bytes="$(wc -c < "$cache" | tr -d ' ')"
if [ "$cache_bytes" -gt 25600 ]; then
  echo "Cache too large: $cache_bytes bytes"
  exit 1
fi

echo "Real OpenCode check passed"
echo "Cache size: $cache_bytes bytes"
