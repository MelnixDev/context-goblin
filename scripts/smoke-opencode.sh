#!/usr/bin/env bash
set -euo pipefail

if ! command -v opencode >/dev/null 2>&1; then
  echo "opencode CLI not found; skipping smoke test"
  exit 0
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

npm run build

tmpdir="$(mktemp -d)"
cleanup() {
  rm -rf "$tmpdir"
}
trap cleanup EXIT

cd "$tmpdir"
npm init -y >/dev/null
printf '{"compilerOptions":{"strict":true}}\n' > tsconfig.json
mkdir -p src .opencode/plugins
printf 'export const hello = "world";\n' > src/index.ts

cat > .opencode/plugins/context-goblin.js <<EOF
export { default, ContextGoblin } from "file://$repo_root/dist/src/index.js"
EOF

opencode run --auto --format json "Call context_goblin_refresh, then context_goblin_status, then summarize whether the cache exists." > opencode-refresh.json

test -f .opencode/cache/context-goblin/project-context.md
test -f .opencode/cache/context-goblin/project-context.state.json

if ! grep -q "context_goblin" opencode-refresh.json; then
  echo "Expected Context Goblin tool activity in OpenCode JSON output"
  exit 1
fi

opencode run --auto --format json "List the available Context Goblin tools and call context_goblin_status." > opencode-status.json
if ! grep -q "context_goblin_status" opencode-status.json; then
  echo "Expected context_goblin_status in OpenCode JSON output"
  exit 1
fi

printf 'API_KEY=super-secret-value\n' > .env
opencode run --auto --format json "Call context_goblin_refresh. Then verify the generated cache does not include secrets." > opencode-secret.json
if grep -R "super-secret-value" .opencode/cache/context-goblin/project-context.md >/dev/null 2>&1; then
  echo "Secret leaked into generated cache"
  exit 1
fi

echo "OpenCode smoke test passed"
