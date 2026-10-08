import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { spawn, spawnSync } from "node:child_process"
import { pathToFileURL } from "node:url"
import { generateProjectContext } from "../dist/src/index.js"

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..")
const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"))
const opencodeBin = process.env.OPENCODE_BIN || path.join(repoRoot, "node_modules/.bin/opencode")
const models = (process.env.OPENCODE_MODELS || "openai/gpt-5.5 openai/gpt-5.6-sol").trim().split(/\s+/)
const runs = Number(process.env.STABILITY_RUNS || 5)
const coldRuns = Number(process.env.STABILITY_COLD_RUNS || 1)
const armTimeoutMs = Number(process.env.STABILITY_ARM_TIMEOUT_MS || 240000)
const modelVariant = process.env.OPENCODE_VARIANT || "minimal"
const protocolVersion = "stable-v3-single-call"
const reportPath = path.join(repoRoot, "examples/model-stability-ab-report.md")

if (!Number.isInteger(runs) || runs < 3) throw new Error("STABILITY_RUNS must be an integer >= 3")
if (!Number.isInteger(coldRuns) || coldRuns < 1 || coldRuns > runs) throw new Error("STABILITY_COLD_RUNS must be between 1 and STABILITY_RUNS")
if (!fs.existsSync(opencodeBin)) throw new Error(`OpenCode CLI not found: ${opencodeBin}`)

const answerFormat = 'Reply in at most 250 words using exactly these headings: Stack, Files, Plan, Risks, Tests, Safety. Mention commands, cartStore.ts, CartDrawer.tsx, a catalog product file, cart tests, and that .env was excluded.'
const baselinePrompt = `No Context Goblin is available. Inspect only what is needed to plan a "Save for later" cart feature. Use built-in read, glob, and grep only; no task/subagents, bash, edits, or .env reads. ${answerFormat}`
const coldPrompt = `Cold-cache Context Goblin run. Call context_goblin_get exactly once and do not call the separate status, refresh, read, or stats tools. Use the returned cache instead of broad discovery and read at most five task-specific files; no task/subagents, bash, edits, or .env reads. Plan a "Save for later" cart feature. ${answerFormat}`
const warmPrompt = `Warm-cache Context Goblin run. Call context_goblin_get exactly once and do not call the separate status, refresh, read, or stats tools. Use the returned cache instead of broad discovery and read at most five task-specific files; no task/subagents, bash, edits, or .env reads. Plan a "Save for later" cart feature. ${answerFormat}`

function write(root, relative, content) {
  const file = path.join(root, relative)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, content)
}

function createFixture(root, withPlugin) {
  write(root, "package.json", JSON.stringify({
    name: "context-goblin-stability-fixture",
    private: true,
    scripts: { dev: "vite", build: "tsc && vite build", test: "vitest", lint: "eslint src --ext ts,tsx" },
    dependencies: { "@vitejs/plugin-react": "latest", vite: "latest", react: "latest", "react-dom": "latest", zustand: "latest" },
    devDependencies: { vitest: "latest", typescript: "latest", eslint: "latest" },
  }, null, 2) + "\n")
  write(root, "tsconfig.json", '{"compilerOptions":{"strict":true,"jsx":"react-jsx","baseUrl":".","paths":{"@/*":["src/*"]}}}\n')
  write(root, "vite.config.ts", "export default {}\n")
  write(root, "README.md", "# Complex Shop Fixture\n\nSynthetic React/Vite cart and catalog app used to test Context Goblin behavior.\n")
  write(root, "AGENTS.md", "# Project Instructions\n\nDo not read `.env` files. Prefer focused reads and add tests for cart behavior changes.\n")
  write(root, "opencode.json", JSON.stringify({
    $schema: "https://opencode.ai/config.json",
    permission: { task: "deny", bash: "deny", edit: "deny" },
  }, null, 2) + "\n")
  write(root, "src/main.tsx", 'import { App } from "./App"\nexport { App }\n')
  write(root, "src/App.tsx", 'import { Header } from "./components/Header"\nimport { routes } from "./routes"\nexport function App() { return <><Header />{routes.catalog}</> }\n')
  write(root, "src/routes.tsx", 'import { ProductList } from "./features/catalog/ProductList"\nimport { CartDrawer } from "./features/cart/CartDrawer"\nexport const routes = { catalog: <><ProductList /><CartDrawer /></> }\n')
  write(root, "src/api/client.ts", 'export async function getJson<T>(url: string): Promise<T> { return (await fetch(url)).json() as Promise<T> }\n')
  write(root, "src/features/catalog/ProductList.tsx", 'import { ProductCard } from "./ProductCard"\nconst products = [{ id: "sku-1", name: "Goblin Mug", price: 12 }]\nexport function ProductList() { return <section>{products.map((product) => <ProductCard key={product.id} product={product} />)}</section> }\n')
  write(root, "src/features/catalog/ProductCard.tsx", 'import { addToCart } from "../cart/cartStore"\nexport interface Product { id: string; name: string; price: number }\nexport function ProductCard({ product }: { product: Product }) { return <button onClick={() => addToCart(product)}>Add {product.name}</button> }\n')
  write(root, "src/features/cart/cartStore.ts", 'import type { Product } from "../catalog/ProductCard"\nexport interface CartItem extends Product { quantity: number }\nlet items: CartItem[] = []\nexport function addToCart(product: Product) {\n  const existing = items.find((item) => item.id === product.id)\n  if (existing) existing.quantity += 1\n  else items.push({ ...product, quantity: 1 })\n}\nexport function removeFromCart(productId: string) { items = items.filter((item) => item.id !== productId) }\nexport function getCartItems() { return items }\nexport function clearCart() { items = [] }\n')
  write(root, "src/features/cart/CartDrawer.tsx", 'import { getCartItems, removeFromCart } from "./cartStore"\nexport function CartDrawer() { return <aside>{getCartItems().map((item) => <button key={item.id} onClick={() => removeFromCart(item.id)}>Remove {item.name}</button>)}</aside> }\n')
  write(root, "src/components/Button.tsx", 'export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) { return <button {...props} /> }\n')
  write(root, "src/components/Header.tsx", 'export function Header() { return <header>Complex Shop</header> }\n')
  write(root, "src/styles/theme.css", ":root { color-scheme: light dark; }\n")
  write(root, "tests/cartStore.test.ts", 'import { addToCart, clearCart, getCartItems, removeFromCart } from "../src/features/cart/cartStore"\nimport { describe, expect, it, beforeEach } from "vitest"\nbeforeEach(() => clearCart())\ndescribe("cartStore", () => {\n  it("adds and removes items", () => {\n    addToCart({ id: "sku-1", name: "Goblin Mug", price: 12 })\n    expect(getCartItems()).toHaveLength(1)\n    removeFromCart("sku-1")\n    expect(getCartItems()).toHaveLength(0)\n  })\n})\n')
  write(root, ".env", "API_KEY=super-secret-complex-check\nPASSWORD=super-secret-password\n")
  if (withPlugin) {
    const pluginUrl = pathToFileURL(path.join(repoRoot, "dist/src/index.js")).href
    write(root, ".opencode/plugins/context-goblin.js", `export { ContextGoblin as default } from ${JSON.stringify(pluginUrl)}\n`)
  }
}

function safeName(value) {
  return value.replace(/[/:]/g, "-").replace(/[^a-zA-Z0-9._-]/g, "")
}

function resultPath(model, round, mode) {
  return path.join(repoRoot, `examples/stability-ab.${safeName(model)}.r${round}.${mode}.result.json`)
}

function runArm({ model, round, mode, root, xdgConfig, prompt }) {
  const rawPath = path.join(repoRoot, `examples/stability-ab.${safeName(model)}.r${round}.${mode}.events.jsonl`)
  const started = Date.now()
  const output = fs.createWriteStream(rawPath, { flags: "w" })
  return new Promise((resolve) => {
    let stdout = ""
    let stderr = ""
    let spawnError = ""
    let timedOut = false
    const child = spawn(opencodeBin, ["run", "--model", model, "--variant", modelVariant, "--auto", "--format", "json", "--dir", root, prompt], {
      env: {
        ...process.env,
        XDG_CONFIG_HOME: xdgConfig,
      },
    })
    child.stdout.on("data", (chunk) => {
      stdout += chunk
      output.write(chunk)
    })
    child.stderr.on("data", (chunk) => { stderr += chunk })
    child.on("error", (error) => { spawnError = error.message })
    const timer = setTimeout(() => {
      timedOut = true
      child.kill("SIGTERM")
    }, armTimeoutMs)
    child.on("close", (code) => {
      clearTimeout(timer)
      output.end()
      const metrics = parseEvents(stdout, root)
      const cachePath = path.join(root, ".opencode/cache/context-goblin/project-context.md")
      const statePath = path.join(root, ".opencode/cache/context-goblin/project-context.state.json")
      const cache = fs.existsSync(cachePath) ? fs.readFileSync(cachePath, "utf8") : ""
      const quality = qualityScore(metrics.text)
      const secretLeak = cache.includes("super-secret") || metrics.text.includes("super-secret")
      const expectedTools = mode === "baseline"
        ? !Object.keys(metrics.toolCounts).some((tool) => tool.startsWith("context_goblin_"))
        : metrics.toolCounts.context_goblin_get === 1
      const refreshOk = mode === "baseline" || !metrics.toolCounts.context_goblin_refresh
      const cacheOk = mode === "baseline" || (fs.existsSync(cachePath) && fs.existsSync(statePath) && cache.length <= 25 * 1024 && !secretLeak)
      const readBudgetOk = mode === "baseline" || metrics.files.length <= 5
      const ok = code === 0 && metrics.errors.length === 0 && expectedTools && refreshOk && cacheOk && readBudgetOk && quality === 6
      resolve({
        protocolVersion, modelVariant, model, round, mode, duration: Date.now() - started, exit: code ?? 1,
        spawnError: timedOut ? `timed out after ${armTimeoutMs}ms` : spawnError,
        stderr, ...metrics, quality, secretLeak, cacheSize: Buffer.byteLength(cache),
        toolOk: expectedTools && refreshOk && readBudgetOk, cacheOk, ok,
      })
    })
  })
}

function parseEvents(raw, root) {
  const toolCounts = {}
  const files = new Set()
  const errors = []
  const texts = []
  const tokens = { input: 0, output: 0, reasoning: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue
    try {
      const record = JSON.parse(line)
      if (record.type === "error") errors.push(JSON.stringify(record.error || record))
      const part = record.part
      if (!part) continue
      if (part.type === "tool" && part.tool) {
        toolCounts[part.tool] = (toolCounts[part.tool] || 0) + 1
        collectFiles(part.state?.input, root, files)
      }
      if (part.type === "text" && part.text) texts.push(part.text)
      if (part.tokens) {
        tokens.input += part.tokens.input || 0
        tokens.output += part.tokens.output || 0
        tokens.reasoning += part.tokens.reasoning || 0
        tokens.cacheRead += part.tokens.cache?.read || 0
        tokens.cacheWrite += part.tokens.cache?.write || 0
        tokens.total += part.tokens.total || 0
      }
    } catch {}
  }
  return { toolCounts, files: [...files].sort(), errors, text: texts.at(-1) || "", tokens }
}

function collectFiles(value, root, files) {
  if (!value) return
  if (typeof value === "string") {
    const candidate = value.replace(/^file:\/\//, "")
    const rawAbsolute = path.isAbsolute(candidate) ? candidate : path.join(root, candidate)
    const canonicalRoot = fs.existsSync(root) ? fs.realpathSync(root) : root
    const absolute = fs.existsSync(rawAbsolute) ? fs.realpathSync(rawAbsolute) : rawAbsolute
    const relative = path.relative(canonicalRoot, absolute).split(path.sep).join("/")
    if (!relative.startsWith("..") && /\.[a-z0-9]+$/i.test(relative)) files.add(relative)
    return
  }
  if (Array.isArray(value)) return value.forEach((item) => collectFiles(item, root, files))
  if (typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (/file|path/i.test(key) || typeof item === "object") collectFiles(item, root, files)
    }
  }
}

const qualityPatterns = [
  /cartStore\.ts|cartStore/i,
  /CartDrawer\.tsx|CartDrawer/i,
  /ProductCard\.tsx|ProductList\.tsx|ProductCard|ProductList/i,
  /cartStore\.test\.ts|test|vitest/i,
  /risk/i,
  /\.env|secret|safety|exclusion/i,
]
function qualityScore(text) { return qualityPatterns.filter((pattern) => pattern.test(text)).length }
function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : Math.round((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2)
}
function range(values) { return `${Math.min(...values)}–${Math.max(...values)}` }
function reduction(before, after) { return before ? Math.round(((before - after) / before) * 100) : 0 }
function percentRange(values) { return `${Math.min(...values)}%–${Math.max(...values)}%` }

const versionRun = spawnSync(opencodeBin, ["--version"], { encoding: "utf8" })
const opencodeVersion = (versionRun.stdout || "unknown").trim()
const results = []

for (const model of models) {
  for (let round = 1; round <= runs; round += 1) {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), "context-goblin-stable-"))
    const xdgConfig = path.join(temp, "xdg-config")
    const roots = {
      baseline: path.join(temp, "baseline"),
      cold: path.join(temp, "cold"),
      warm: path.join(temp, "warm"),
    }
    fs.mkdirSync(xdgConfig, { recursive: true })
    createFixture(roots.baseline, false)
    createFixture(roots.cold, true)
    createFixture(roots.warm, true)
    await generateProjectContext({ rootDir: roots.warm })
    const prompts = { baseline: baselinePrompt, cold: coldPrompt, warm: warmPrompt }
    const availableModes = ["baseline", ...(round <= coldRuns ? ["cold"] : []), "warm"]
    const order = round % 2 === 1 ? availableModes : [...availableModes].reverse()
    try {
      for (const mode of order) {
        const savedPath = resultPath(model, round, mode)
        if (process.env.RESUME_STABILITY !== "0" && fs.existsSync(savedPath)) {
          const saved = JSON.parse(fs.readFileSync(savedPath, "utf8"))
          if (saved.ok && saved.protocolVersion === protocolVersion && saved.modelVariant === modelVariant && saved.packageVersion === packageJson.version) {
            results.push(saved)
            console.log(`[${model}] round ${round}/${runs}: ${mode} (reused)`)
            continue
          }
        }
        console.log(`[${model}] round ${round}/${runs}: ${mode}`)
        const result = await runArm({ model, round, mode, root: roots[mode], xdgConfig, prompt: prompts[mode] })
        results.push(result)
        console.log(`  ${result.ok ? "ok" : "FAIL"}; reads=${result.files.length}; input=${result.tokens.input}; total=${result.tokens.total}; quality=${result.quality}/6`)
        if (result.ok) fs.writeFileSync(savedPath, JSON.stringify({ ...result, packageVersion: packageJson.version, stderr: "", errors: [] }, null, 2) + "\n")
        if (result.spawnError) throw new Error(`OpenCode arm failed to execute: ${result.spawnError}; completed arms were saved and the next run will resume`)
        if (result.errors.some((error) => /usage limit|statusCode\\?":429|HTTP 429/i.test(error))) {
          throw new Error("OpenCode usage limit reached; valid completed arms were saved and the next run will resume")
        }
      }
    } finally {
      fs.rmSync(temp, { recursive: true, force: true })
    }
  }
}

function aggregate(model, mode) {
  const runsForArm = results.filter((item) => item.model === model && item.mode === mode)
  return {
    runs: runsForArm,
    ok: runsForArm.filter((item) => item.ok).length,
    reads: median(runsForArm.map((item) => item.files.length)),
    readsRange: range(runsForArm.map((item) => item.files.length)),
    input: median(runsForArm.map((item) => item.tokens.input)),
    inputRange: range(runsForArm.map((item) => item.tokens.input)),
    cacheRead: median(runsForArm.map((item) => item.tokens.cacheRead)),
    total: median(runsForArm.map((item) => item.tokens.total)),
    totalRange: range(runsForArm.map((item) => item.tokens.total)),
    duration: median(runsForArm.map((item) => item.duration)),
    quality: Math.min(...runsForArm.map((item) => item.quality)),
    maxCache: Math.max(...runsForArm.map((item) => item.cacheSize)),
    leaks: runsForArm.filter((item) => item.secretLeak).length,
  }
}

const summaries = []
for (const model of models) {
  const baseline = aggregate(model, "baseline")
  for (const mode of ["cold", "warm"]) {
    const goblin = aggregate(model, mode)
    const pairRounds = mode === "cold"
      ? Array.from({ length: coldRuns }, (_, index) => index + 1)
      : Array.from({ length: runs }, (_, index) => index + 1)
    const pairs = pairRounds.map((round) => {
      const b = results.find((item) => item.model === model && item.mode === "baseline" && item.round === round)
      const g = results.find((item) => item.model === model && item.mode === mode && item.round === round)
      return {
        round,
        reads: reduction(b.files.length, g.files.length),
        input: reduction(b.tokens.input, g.tokens.input),
        total: reduction(b.tokens.total, g.tokens.total),
      }
    })
    const medians = {
      reads: median(pairs.map((pair) => pair.reads)),
      input: median(pairs.map((pair) => pair.input)),
      total: median(pairs.map((pair) => pair.total)),
    }
    const expectedGoblinRuns = mode === "cold" ? coldRuns : runs
    const allValid = baseline.ok === runs && goblin.ok === expectedGoblinRuns && goblin.quality === 6 && goblin.leaks === 0
    const stable = allValid && medians.reads >= 25 && medians.input > 0 && medians.total > 0
    const regressed = [medians.reads, medians.input, medians.total].some((value) => value < 0)
    summaries.push({ model, mode, baseline, goblin, pairs, medians, allValid, result: stable ? "pass" : allValid && !regressed ? "mixed" : "fail" })
  }
}

const summaryRows = summaries.map((item) => `| ${item.model} | ${item.mode} | ${item.baseline.ok}/${runs} | ${item.goblin.ok}/${item.mode === "cold" ? coldRuns : runs} | ${item.baseline.reads} | ${item.goblin.reads} | ${item.medians.reads}% | ${percentRange(item.pairs.map((pair) => pair.reads))} | ${item.medians.input}% | ${percentRange(item.pairs.map((pair) => pair.input))} | ${item.medians.total}% | ${item.goblin.quality}/6 | ${item.goblin.leaks} | ${item.result} |`).join("\n")

const details = summaries.map((item) => `## ${item.model} — ${item.mode}\n\n- Valid baseline runs: ${item.baseline.ok}/${runs}\n- Valid Goblin runs: ${item.goblin.ok}/${item.mode === "cold" ? coldRuns : runs}\n- Baseline reads median (range): ${item.baseline.reads} (${item.baseline.readsRange})\n- Goblin reads median (range): ${item.goblin.reads} (${item.goblin.readsRange})\n- Paired file-read reduction median (range): ${item.medians.reads}% (${percentRange(item.pairs.map((pair) => pair.reads))})\n- Paired uncached-input reduction median (range): ${item.medians.input}% (${percentRange(item.pairs.map((pair) => pair.input))})\n- Paired total-event-token reduction median (range): ${item.medians.total}% (${percentRange(item.pairs.map((pair) => pair.total))})\n- Baseline input median (range): ${item.baseline.input} (${item.baseline.inputRange})\n- Goblin input median (range): ${item.goblin.input} (${item.goblin.inputRange})\n- Baseline total median (range): ${item.baseline.total} (${item.baseline.totalRange})\n- Goblin total median (range): ${item.goblin.total} (${item.goblin.totalRange})\n- Goblin cache-read token median: ${item.goblin.cacheRead}\n- Goblin duration median: ${item.goblin.duration}ms\n- Minimum quality: ${item.goblin.quality}/6\n- Maximum cache size: ${item.goblin.maxCache} bytes\n- Secret leaks: ${item.goblin.leaks}\n- Stability result: ${item.result}\n\n| Round | File-read reduction | Input reduction | Total reduction |\n| ---: | ---: | ---: | ---: |\n${item.pairs.map((pair) => `| ${pair.round} | ${pair.reads}% | ${pair.input}% | ${pair.total}% |`).join("\n")}\n`).join("\n")

const report = `# Context Goblin Repeated Stability A/B Report\n\nGenerated: ${new Date().toISOString()}\nOpenCode version: ${opencodeVersion}\nContext Goblin version: ${packageJson.version}\nProtocol: ${protocolVersion}\nModel variant: ${modelVariant}\nBaseline/warm runs per model: ${runs}\nCold refresh controls per model: ${coldRuns}\n\n## Protocol\n\n- Each round uses fresh copies of the same React/Vite fixture. Baseline and warm-cache Goblin run in every round; cold-cache Goblin runs ${coldRuns} time(s) per model as a refresh control.\n- Execution order alternates each round to reduce ordering and provider-cache bias.\n- The single context_goblin_get call refreshes a missing/stale cold cache and reuses a pre-generated fresh warm cache.\n- Goblin runs may inspect at most five task-specific implementation files after reading the cache.\n- Answers use a fixed six-section format capped at 250 words.\n- Results use paired per-round reductions, medians, and observed ranges rather than a single run.\n- Uncached input excludes provider-reported cache-read tokens. Total event tokens include input, output, reasoning, and provider cache accounting.\n- Stable pass requires every required run valid, quality 6/6, no secret leaks, median file-read reduction >=25%, positive median uncached-input reduction, and positive median total-event-token reduction.\n\n## Summary\n\n| Model | Cache | Baseline valid | Goblin valid | Baseline reads median | Goblin reads median | File saved median | File saved range | Input saved median | Input saved range | Total saved median | Min quality | Leaks | Result |\n| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |\n${summaryRows}\n\n${details}`

fs.writeFileSync(reportPath, report.trimEnd() + "\n")
console.log(`Wrote ${path.relative(repoRoot, reportPath)}`)

const failures = results.filter((item) => !item.ok)
if (failures.length) {
  for (const failure of failures) console.error(`${failure.model} round ${failure.round} ${failure.mode} failed: ${failure.stderr.slice(0, 500)}`)
  process.exitCode = 1
}
