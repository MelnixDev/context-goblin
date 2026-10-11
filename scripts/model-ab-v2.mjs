import fs from "node:fs"
import path from "node:path"
import os from "node:os"
import { spawn, execFile, execFileSync } from "node:child_process"
import { promisify } from "node:util"
import { createHash, randomUUID } from "node:crypto"
import { pathToFileURL } from "node:url"
import { createBenchmarkFixture } from "./benchmark-v2-fixture.mjs"
import { parseLines, measureV2, answerCoverage, metricChange } from "./benchmark-v2-metrics.mjs"
import { validateIdentity, quotaReset, loadCompletedArm } from "./benchmark-v2-state.mjs"

const repo = process.cwd()
const pkg = JSON.parse(fs.readFileSync(path.join(repo, "package.json"), "utf8"))
const binary = process.env.OPENCODE_V2_BIN || path.join(repo, "node_modules/@opencode/cli/bin/opencode.exe")
const models = (process.env.OPENCODE_MODELS || "openai/gpt-6-sol openai/gpt-6.1-sol").trim().split(/\s+/)
const variant = process.env.OPENCODE_VARIANT || "low"
const version = execFileSync(binary, ["--version"], { encoding: "utf8" }).trim()
fs.mkdirSync(path.join(repo, "benchmark-results"), { recursive: true })
const resumed = process.env.AB_V2_RESUME
const runRoot = resumed ? path.resolve(repo, resumed) : fs.mkdtempSync(path.join(repo, "benchmark-results/v2-"))
const report = path.join(repo, "examples/opencode-v2-ab-report.md")
const protocol = "v2-single-call-cold-v1"
const fixtureHash = createHash("sha256").update(fs.readFileSync(new URL("./benchmark-v2-fixture.mjs", import.meta.url))).digest("hex")
const task = 'Plan where and how to add a "Save for later" cart feature. Do not modify files or read .env. Use repository read, glob and grep tools only, plus Context Goblin when requested; no shell, subagents, web access, or separate diagnostics. Reply in at most 250 words with headings Stack, Files, Plan, Risks, Tests, Safety. Include available commands, exact relevant files, state transitions, UI changes, and tests.'
const prompts = {
  baseline: "No Context Goblin is available. Inspect the repository as needed. " + task,
  goblin: "Call context_goblin_get exactly once before any repository discovery. Use its cache to avoid broad reads, then inspect only files needed for implementation details. " + task,
}
const hash = (file) => createHash("sha256").update(fs.readFileSync(new URL(file, import.meta.url))).digest("hex")
const identity = { packageVersion: pkg.version, opencodeVersion: version, protocol, models, variant,
  fixtureHash, observerHash: hash("./benchmark-v2-observer.mjs"),
  metricsHash: hash("./benchmark-v2-metrics.mjs"),
  promptsHash: createHash("sha256").update(JSON.stringify(prompts)).digest("hex") }
const manifestPath = path.join(runRoot, "manifest.json")
let manifest
if (resumed) {
  manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"))
  validateIdentity(manifest, identity)
  for (const model of models) for (const mode of ["baseline", "goblin"]) {
    const rawPath = path.join(runRoot, model.replace(/[^a-z0-9.-]/gi, "-") + "." + mode + ".events.jsonl")
    if (!fs.existsSync(rawPath)) continue
    const reset = quotaReset(fs.readFileSync(rawPath, "utf8"))
    if (reset && Date.now() < reset) throw new Error("Provider quota is exhausted until " +
      new Date(reset).toISOString() + "; no model request submitted")
  }
} else {
  manifest = { ...identity, startedAt: new Date().toISOString(),
    fixtureRoot: fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "context-goblin-v2-ab-"))) }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
}
const fixtureRoot = manifest.fixtureRoot
fs.mkdirSync(path.join(runRoot, "xdg"), { recursive: true })
const permissions = [
  { action: "*", resource: "*", effect: "deny" },
  ...["read", "glob", "grep", "codemode", "context_goblin_get"].map((action) => ({ action, resource: "*", effect: "allow" })),
  { action: "read", resource: "**/.env*", effect: "deny" },
]
const all = []
const exec = promisify(execFile)

async function run(model, mode) {
  const modelRoot = path.join(fixtureRoot, model.replace(/[^a-z0-9.-]/gi, "-"))
  fs.mkdirSync(modelRoot, { recursive: true })
  const root = fs.mkdtempSync(path.join(modelRoot, mode + "-"))
  createBenchmarkFixture(root)
  // Keep evidence outside the scanned fixture.
  const evidencePath = path.join(runRoot, model.replace(/[^a-z0-9.-]/gi, "-") + "." + mode + ".observations.jsonl")
  const prefix = path.join(runRoot, model.replace(/[^a-z0-9.-]/gi, "-") + "." + mode)
  const attempt = ".attempt-" + Date.now()
  for (const suffix of [".events.jsonl", ".stderr.txt", ".observations.jsonl", ".result.json"]) {
    if (fs.existsSync(prefix + suffix)) fs.renameSync(prefix + suffix, prefix + attempt + suffix)
  }
  const observer = path.join(runRoot, "observer")
  fs.mkdirSync(observer, { recursive: true })
  fs.writeFileSync(path.join(observer, "index.js"), "export { default } from " + JSON.stringify(pathToFileURL(path.join(repo, "scripts/benchmark-v2-observer.mjs")).href) + "\n")
  const plugins = [
    ...(mode === "goblin" ? [path.join(repo, "dist/src")] : []),
    { package: observer, options: { evidencePath } },
  ]
  fs.writeFileSync(path.join(root, "opencode.json"), JSON.stringify({
    plugins, agents: { benchmark: { mode: "primary", steps: 12, permissions } },
  }, null, 2))
  const started = Date.now()
  console.log("Running " + model + "#" + variant + " " + mode)
  const env = { ...process.env, XDG_CONFIG_HOME: path.join(runRoot, "xdg"),
    OPENCODE_PASSWORD: randomUUID(),
    OPENCODE_TIMEOUT_MS: process.env.OPENCODE_TIMEOUT_MS || "180000" }
  const server = spawn(binary, ["serve", "--hostname", "127.0.0.1", "--port", "0"], {
    cwd: root, env, stdio: ["ignore", "pipe", "pipe"],
  })
  try {
    const url = await new Promise((resolve, reject) => {
      let output = ""
      const timer = setTimeout(() => reject(new Error("Private server startup timed out")), 30000)
      const consume = (chunk) => {
        output += chunk
        const match = output.match(/http:\/\/127\.0\.0\.1:\d+/)
        if (match) { clearTimeout(timer); resolve(match[0]) }
      }
      server.stdout.on("data", consume)
      server.stderr.on("data", consume)
      server.once("error", (error) => { clearTimeout(timer); reject(error) })
      server.once("exit", () => { clearTimeout(timer); reject(new Error("Private server exited")) })
    })
    let ready = false
    for (let attempt = 0; attempt < 50; attempt++) {
      const { stdout } = await exec(binary, ["api", "agent.list", "--server", url,
        "--param", "location.directory=" + root], { cwd: root, env, timeout: 15000 })
      if (JSON.parse(stdout).data?.some((agent) => agent.id === "benchmark")) { ready = true; break }
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
    if (!ready) throw new Error("Benchmark agent did not load; no model request was submitted")
    const [providerID, modelID] = model.split("/")
    const { stdout: created } = await exec(binary, ["api", "session.create", "--server", url,
      "--data", JSON.stringify({ location: { directory: root }, agent: "benchmark",
        model: { id: modelID, providerID, variant }, title: protocol + " " + mode })],
      { cwd: root, env, timeout: 15000 })
    const response = JSON.parse(created)
    const session = response.data ?? response
    if (!session.id || session.location?.directory !== root) throw new Error("Session location preflight failed")
    return await new Promise((resolve) => {
    let stdout = "", stderr = ""
    const child = spawn(process.execPath, [path.join(repo, "scripts/run-opencode.mjs"), binary,
      "run", "--server", url, "--session", session.id, "--agent", "benchmark", "--model", model + "#" + variant,
      "--auto", "--format", "json", prompts[mode]], {
      cwd: root, env,
    })
    child.stdout.on("data", (chunk) => { stdout += chunk })
    child.stderr.on("data", (chunk) => { stderr += chunk })
    child.on("error", (error) => { stderr += error.message })
    child.on("close", (code) => {
      const prefix = path.join(runRoot, model.replace(/[^a-z0-9.-]/gi, "-") + "." + mode)
      fs.writeFileSync(prefix + ".events.jsonl", stdout)
      fs.writeFileSync(prefix + ".stderr.txt", stderr)
      let records = [], cli = [], parseError = ""
      try {
        records = parseLines(fs.existsSync(evidencePath) ? fs.readFileSync(evidencePath, "utf8") : "")
        cli = parseLines(stdout)
      } catch (error) { parseError = error.message }
      const metrics = measureV2(records, fs.realpathSync(root))
      const text = cli.filter((event) => event.type === "text" || event.part?.type === "text")
        .map((event) => event.part?.text || event.text || event.data?.text || "").join("\n")
      const cachePath = path.join(root, ".opencode/cache/context-goblin/project-context.md")
      const cache = fs.existsSync(cachePath) ? fs.readFileSync(cachePath, "utf8") : ""
      const coverage = answerCoverage(text)
      const forbidden = Object.keys(metrics.tools).filter((tool) => !["read", "glob", "grep", "codemode", "context_goblin_get"].includes(tool))
      const expectedTools = mode === "baseline"
        ? !Object.keys(metrics.tools).some((tool) => tool.startsWith("context_goblin_"))
        : metrics.tools.context_goblin_get === 1 && records.find((event) => event.type === "tool")?.tool === "context_goblin_get"
      const leaked = metrics.secretLeak || (stdout + cache).includes("super-secret")
      const ok = code === 0 && !parseError && !metrics.errors.length &&
        !cli.some((event) => event.type === "error") && text.length > 0 && coverage === 6 &&
        /save.for.later|savedItems|saveForLater/i.test(text) && expectedTools &&
        !forbidden.length && !metrics.files.some((file) => /(^|\/)\.env/.test(file)) &&
        !leaked && (mode === "baseline" || cache.length > 0 && Buffer.byteLength(cache) <= 25 * 1024)
      const result = { model, variant, mode, root, durationMs: Date.now() - started,
        exit: code, metrics, coverage, cacheBytes: Buffer.byteLength(cache), text,
        expectedTools, forbidden, leaked, parseError, ok }
      fs.writeFileSync(prefix + ".result.json", JSON.stringify(result, null, 2))
      console.log(JSON.stringify({ model, mode, ok, steps: metrics.steps,
        reads: metrics.files.length, tokens: metrics.tokens, tools: metrics.tools,
        errors: metrics.errors, parseError, coverage }))
      resolve(result)
    })
    })
  } finally {
    if (server.exitCode === null) {
      const stopped = new Promise((resolve) => server.once("exit", resolve))
      server.kill("SIGTERM")
      const timer = setTimeout(() => server.kill("SIGKILL"), 2000)
      await stopped
      clearTimeout(timer)
    }
  }
}

for (const [index, model] of models.entries()) {
  const order = index % 2 ? ["goblin", "baseline"] : ["baseline", "goblin"]
  for (const mode of order) {
    const completed = loadCompletedArm(runRoot, model, mode)
    const result = completed ?? await run(model, mode)
    if (completed) console.log("Reused verified completed arm: " + model + " " + mode)
    all.push(result)
    if (!result.ok) {
      console.error("Incomplete/invalid arm; stopping further model calls. Existing report preserved. Evidence: " + runRoot)
      process.exit(1)
    }
  }
}

const sanitize = (text) => text.replaceAll(fs.realpathSync(runRoot), "<benchmark>")
  .replaceAll(runRoot, "<benchmark>").replaceAll(fixtureRoot, "<fixture>")
  .replace(/super-secret[-\w]*/g, "[REDACTED]")
const rows = models.map((model) => {
  const baseline = all.find((item) => item.model === model && item.mode === "baseline")
  const goblin = all.find((item) => item.model === model && item.mode === "goblin")
  const changes = [metricChange(baseline.metrics.files.length, goblin.metrics.files.length),
    metricChange(baseline.metrics.tokens.input, goblin.metrics.tokens.input),
    metricChange(baseline.metrics.tokens.total, goblin.metrics.tokens.total)]
  return { model, baseline, goblin, changes, efficiency: changes.some((c) => c.status === "fail")
    ? "fail" : changes.every((c) => c.status === "pass") ? "pass" : "mixed" }
})
const pct = (change) => change.reduction === null ? "n/a" : change.reduction + "%"
let md = "# Context Goblin OpenCode V2 A/B Report\n\n" +
  "Run started: " + manifest.startedAt + "\nReport generated: " + new Date().toISOString() + "\nOpenCode version: " + version +
  "\nContext Goblin version: " + pkg.version + "\nProtocol: " + protocol +
  "\nReasoning variant: " + variant + "\nFixture SHA-256: " + fixtureHash +
  "\n\n## Summary\n\n| Model | Baseline reads | Goblin reads | Read reduction | Input reduction | Total reduction | Coverage baseline/Goblin | Compatibility | Efficiency |\n" +
  "| --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |\n" +
  rows.map((row) => "| " + row.model + " | " + row.baseline.metrics.files.length + " | " +
    row.goblin.metrics.files.length + " | " + row.changes.map(pct).join(" | ") +
    " | 6/6 / 6/6 | pass | " + row.efficiency + " |").join("\n") +
  "\n\nOne cold-cache session per arm and model. This is initial evidence, not a stability result. Baseline runs first for GPT 6 Sol; Goblin runs first for GPT 6.1 Sol. Provider cache state is not controlled.\n\n" +
  "Counts come from a read-only observer of native tool completion hooks and session.step.ended events, including calls made through codemode. Unique completed read paths are counted; errors and cumulative usage updates are excluded. Total tokens sum disjoint step input, visible output, reasoning, cache-read, and cache-write counters. Auxiliary model requests and provider invoice totals are outside this measurement.\n\n" +
  "Both arms use the same fixture and task, a 12-step limit, and an isolated global config. Permissions deny edits, shell, subagents, web access, and .env reads. Only Goblin loads the cache plugin. It starts without a pre-generated cache and must call context_goblin_get once before discovery. No output compaction is enabled.\n\n" +
  "Coverage is a six-topic lexical checklist, not an independent correctness score. Raw answers and files inspected are listed below. Negative reductions indicate increased usage and fail efficiency. See [run history](./opencode-v2-ab-status.md) for interruptions and resume timing.\n\n"
for (const row of rows) {
  md += "## " + row.model + "\n"
  for (const arm of [row.baseline, row.goblin]) {
    md += "\n### " + arm.mode + "\n\nTokens: " + JSON.stringify(arm.metrics.tokens) +
      "\n\nSteps: " + arm.metrics.steps + "; duration: " + arm.durationMs +
      " ms; cache: " + arm.cacheBytes + " bytes; reported step cost: " + arm.metrics.cost +
      "\n\nTools: " + JSON.stringify(arm.metrics.tools) +
      "\n\nFiles read:\n\n" + arm.metrics.files.map((file) => "- " + file).join("\n") +
      "\n\nAnswer:\n\n~~~~text\n" + sanitize(arm.text) + "\n~~~~\n\n"
  }
}
fs.writeFileSync(report, md)
console.log("Report: " + report)
console.log("Raw evidence (ignored by Git): " + runRoot)
