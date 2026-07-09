#!/usr/bin/env bash
set -euo pipefail

if ! command -v opencode >/dev/null 2>&1; then
  echo "opencode CLI not found"
  exit 1
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
standard_models="openai/gpt-5.5"
free_models="opencode/deepseek-v4-flash-free opencode/mimo-v2.5-free opencode/nemotron-3-ultra-free opencode/north-mini-code-free"
other_models="openai/gpt-5.5-fast opencode/gpt-5.5 opencode/gpt-5.4-mini"
model_group="${MODEL_GROUP:-all}"

if [ -n "${OPENCODE_MODELS:-}" ]; then
  models="$OPENCODE_MODELS"
elif [ "$model_group" = "standard" ]; then
  models="$standard_models"
elif [ "$model_group" = "free" ]; then
  models="$free_models"
elif [ "$model_group" = "other" ]; then
  models="$other_models"
elif [ "$model_group" = "all" ]; then
  models="$standard_models $free_models $other_models"
else
  echo "Unknown MODEL_GROUP: $model_group"
  exit 1
fi

report_path="$repo_root/examples/model-complex-task-ab-report.md"
metadata_path="$repo_root/examples/model-complex-task-ab.metadata.tsv"

mkdir -p "$repo_root/examples"

if [ "${REUSE_EXISTING:-0}" != "1" ]; then
  npm run build
  : > "$metadata_path"
fi

create_fixture() {
  local root="$1"
  mkdir -p \
    "$root/src/api" \
    "$root/src/components" \
    "$root/src/features/catalog" \
    "$root/src/features/cart" \
    "$root/src/styles" \
    "$root/tests"

  cat > "$root/package.json" <<'JSON'
{
  "name": "context-goblin-complex-fixture",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest",
    "lint": "eslint src --ext ts,tsx"
  },
  "dependencies": {
    "@vitejs/plugin-react": "latest",
    "vite": "latest",
    "react": "latest",
    "react-dom": "latest",
    "zustand": "latest"
  },
  "devDependencies": {
    "vitest": "latest",
    "typescript": "latest",
    "eslint": "latest"
  }
}
JSON
  cat > "$root/tsconfig.json" <<'JSON'
{"compilerOptions":{"strict":true,"jsx":"react-jsx","baseUrl":".","paths":{"@/*":["src/*"]}}}
JSON
  printf 'export default {}\n' > "$root/vite.config.ts"
  cat > "$root/README.md" <<'MD'
# Complex Shop Fixture

Synthetic React/Vite cart and catalog app used to test Context Goblin behavior.
MD
  cat > "$root/AGENTS.md" <<'MD'
# Project Instructions

Do not read `.env` files. Prefer focused reads and add tests for cart behavior changes.
MD
  cat > "$root/src/main.tsx" <<'TS'
import { App } from "./App"
export { App }
TS
  cat > "$root/src/App.tsx" <<'TS'
import { Header } from "./components/Header"
import { routes } from "./routes"
export function App() { return <><Header />{routes.catalog}</> }
TS
  cat > "$root/src/routes.tsx" <<'TS'
import { ProductList } from "./features/catalog/ProductList"
import { CartDrawer } from "./features/cart/CartDrawer"
export const routes = { catalog: <><ProductList /><CartDrawer /></> }
TS
  cat > "$root/src/api/client.ts" <<'TS'
export async function getJson<T>(url: string): Promise<T> { return (await fetch(url)).json() as Promise<T> }
TS
  cat > "$root/src/features/catalog/ProductList.tsx" <<'TS'
import { ProductCard } from "./ProductCard"
const products = [{ id: "sku-1", name: "Goblin Mug", price: 12 }]
export function ProductList() { return <section>{products.map((product) => <ProductCard key={product.id} product={product} />)}</section> }
TS
  cat > "$root/src/features/catalog/ProductCard.tsx" <<'TS'
import { addToCart } from "../cart/cartStore"
export interface Product { id: string; name: string; price: number }
export function ProductCard({ product }: { product: Product }) { return <button onClick={() => addToCart(product)}>Add {product.name}</button> }
TS
  cat > "$root/src/features/cart/cartStore.ts" <<'TS'
import type { Product } from "../catalog/ProductCard"
export interface CartItem extends Product { quantity: number }
let items: CartItem[] = []
export function addToCart(product: Product) {
  const existing = items.find((item) => item.id === product.id)
  if (existing) existing.quantity += 1
  else items.push({ ...product, quantity: 1 })
}
export function removeFromCart(productId: string) { items = items.filter((item) => item.id !== productId) }
export function getCartItems() { return items }
export function clearCart() { items = [] }
TS
  cat > "$root/src/features/cart/CartDrawer.tsx" <<'TS'
import { getCartItems, removeFromCart } from "./cartStore"
export function CartDrawer() { return <aside>{getCartItems().map((item) => <button key={item.id} onClick={() => removeFromCart(item.id)}>Remove {item.name}</button>)}</aside> }
TS
  cat > "$root/src/components/Button.tsx" <<'TS'
export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) { return <button {...props} /> }
TS
  cat > "$root/src/components/Header.tsx" <<'TS'
export function Header() { return <header>Complex Shop</header> }
TS
  printf ':root { color-scheme: light dark; }\n' > "$root/src/styles/theme.css"
  cat > "$root/tests/cartStore.test.ts" <<'TS'
import { addToCart, clearCart, getCartItems, removeFromCart } from "../src/features/cart/cartStore"
import { describe, expect, it, beforeEach } from "vitest"
beforeEach(() => clearCart())
describe("cartStore", () => {
  it("adds and removes items", () => {
    addToCart({ id: "sku-1", name: "Goblin Mug", price: 12 })
    expect(getCartItems()).toHaveLength(1)
    removeFromCart("sku-1")
    expect(getCartItems()).toHaveLength(0)
  })
})
TS
  printf 'API_KEY=super-secret-complex-check\nPASSWORD=super-secret-password\n' > "$root/.env"
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

baseline_prompt='No Context Goblin is available. Use normal OpenCode tools to inspect the smallest files needed to plan adding a "Save for later" feature to the cart. Read package.json, src/App.tsx, src/routes.tsx, src/features/cart/cartStore.ts, src/features/cart/CartDrawer.tsx, src/features/catalog/ProductCard.tsx, src/features/catalog/ProductList.tsx, and tests/cartStore.test.ts. Do not read .env. Do not modify files. Return stack, commands, entry points, exact files inspected, implementation plan, risks, tests, and safety exclusions.'
goblin_prompt='Use Context Goblin first. Call context_goblin_status. If missing or stale, call context_goblin_refresh. Call context_goblin_read. Then inspect only the smallest extra files needed to plan adding a "Save for later" feature to the cart. Do not read .env. Do not modify files. Return stack, commands, entry points, exact files inspected or recommended, implementation plan, risks, tests, and safety exclusions.'

if [ "${REUSE_EXISTING:-0}" != "1" ]; then
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

    baseline_raw="$repo_root/examples/model-complex-task-ab.$name.baseline.events.jsonl"
    goblin_raw="$repo_root/examples/model-complex-task-ab.$name.goblin.events.jsonl"
    baseline_stderr="$tmpdir/baseline.stderr"
    goblin_stderr="$tmpdir/goblin.stderr"

    echo "Running complex baseline: $model"
    baseline_result="$(run_opencode "$model" "$baseline_dir" "$baseline_prompt" "$baseline_raw" "$baseline_stderr")"
    echo "Running complex Context Goblin: $model"
    goblin_result="$(run_opencode "$model" "$goblin_dir" "$goblin_prompt" "$goblin_raw" "$goblin_stderr")"

    printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' \
      "$model" "$baseline_dir" "$goblin_dir" "$baseline_raw" "$goblin_raw" \
      "$baseline_stderr" "$goblin_stderr" "${baseline_result%%:*}" "${baseline_result##*:}" \
      "${goblin_result%%:*}" "${goblin_result##*:}" "$name" >> "$metadata_path"
  done
fi

OPENCODE_VERSION="$(opencode --version 2>/dev/null || printf 'not available')" \
REPO_ROOT="$repo_root" \
METADATA_PATH="$metadata_path" \
REPORT_PATH="$report_path" \
MODEL_GROUP_USED="$model_group" \
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

const qualityChecks = [
  { label: "cartStore.ts", pattern: /cartStore\.ts|cartStore/i },
  { label: "CartDrawer.tsx", pattern: /CartDrawer\.tsx|CartDrawer/i },
  { label: "catalog product file", pattern: /ProductCard\.tsx|ProductList\.tsx|ProductCard|ProductList/i },
  { label: "tests", pattern: /cartStore\.test\.ts|test|vitest/i },
  { label: "risks", pattern: /risk/i },
  { label: "safety exclusions", pattern: /\.env|secret|safety|exclusion/i },
]

function quality(text) {
  const matched = qualityChecks.filter((check) => check.pattern.test(text || ""))
  return { score: matched.length, matched: matched.map((check) => check.label) }
}

const results = rows.map((row) => {
  const baseline = parseEvents(row.baselineRaw, row.baselineRoot)
  const goblin = parseEvents(row.goblinRaw, row.goblinRoot)
  const cachePath = path.join(row.goblinRoot, ".opencode/cache/context-goblin/project-context.md")
  const statePath = path.join(row.goblinRoot, ".opencode/cache/context-goblin/project-context.state.json")
  const cache = fs.existsSync(cachePath) ? fs.readFileSync(cachePath, "utf8") : ""
  const secretLeakage = cache.includes("super-secret") || /(?:API_KEY|PASSWORD|TOKEN|SECRET|PRIVATE_KEY)=([^\[]\S+)/.test(cache)
  const cacheSize = Buffer.byteLength(cache)
  const q = quality(goblin.text)
  const baselineError = row.baselineExit !== 0 || baseline.errors.length > 0
  const goblinError = row.goblinExit !== 0 || goblin.errors.length > 0
  const toolUseOk = Boolean(goblin.toolCounts.context_goblin_status && goblin.toolCounts.context_goblin_refresh && goblin.toolCounts.context_goblin_read && fs.existsSync(cachePath) && fs.existsSync(statePath) && !secretLeakage && cacheSize <= 25 * 1024 && goblin.files.length <= baseline.files.length)
  const answerOk = q.score >= 4
  const baselineOk = !baselineError
  const goblinOk = !goblinError && toolUseOk && answerOk
  const result = baselineError || goblinError ? "error" : baselineOk && goblinOk ? "pass" : "fail"
  return { row, baseline, goblin, baselineOk, goblinOk, toolUseOk, answerOk, result, cacheSize, secretLeakage, quality: q, fileReduction: reduction(baseline.files.length, goblin.files.length), inputReduction: reduction(baseline.inputTokens, goblin.inputTokens), totalReduction: reduction(baseline.totalTokens, goblin.totalTokens) }
})

const summaryRows = results.map(({ row, baseline, goblin, baselineOk, toolUseOk, answerOk, result, cacheSize, secretLeakage, quality, fileReduction, inputReduction }) => `| ${row.model} | ${yn(baselineOk)} | ${yn(toolUseOk)} | ${yn(answerOk)} | ${baseline.files.length} | ${goblin.files.length} | ${fileReduction} | ${inputReduction} | ${quality.score}/6 | ${cacheSize} | ${secretLeakage ? "fail" : "pass"} | ${result} |`).join("\n")

const details = results.map(({ row, baseline, goblin, baselineOk, goblinOk, toolUseOk, answerOk, result, cacheSize, secretLeakage, quality, fileReduction, inputReduction, totalReduction }) => `## ${row.model}

### Summary

- Baseline completed: ${baselineOk}
- Context Goblin completed and validated: ${Boolean(goblinOk)}
- Tool use OK: ${toolUseOk}
- Answer OK: ${answerOk}
- Result: ${result}
- Baseline direct file reads: ${baseline.files.length}
- Context Goblin built-in file reads: ${goblin.files.length}
- File-read reduction: ${fileReduction}
- Input-token reduction: ${inputReduction}
- Total-token reduction: ${totalReduction}
- Quality score: ${quality.score}/6
- Quality hits: ${quality.matched.length ? quality.matched.join(", ") : "none"}
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

const report = `# Complex Task Context Goblin A/B Report

Generated: ${new Date().toISOString()}
OpenCode version: ${process.env.OPENCODE_VERSION}
Context Goblin version: ${packageJson.version}
Model group: ${process.env.MODEL_GROUP_USED}

## Task

Plan adding a "Save for later" feature to a realistic React/Vite cart and catalog app. The model must not modify files or read .env.

## Summary

| Model | Baseline OK | Tool Use OK | Answer OK | Baseline Reads | Goblin Reads | File Reduction | Input Token Reduction | Quality | Cache Size | Secret Leak | Result |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
${summaryRows}

${details}
`

fs.writeFileSync(process.env.REPORT_PATH, report)
console.log(report)

if (!results.some((result) => result.result === "pass")) process.exit(1)
NODE
