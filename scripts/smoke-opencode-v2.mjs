import assert from "node:assert/strict"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { execFile, spawn } from "node:child_process"
import { promisify } from "node:util"
import { randomUUID } from "node:crypto"

const exec = promisify(execFile)
const repo = process.cwd()
const root = await fs.mkdtemp(path.join(os.tmpdir(), "context-goblin-v2-"))
const binary = process.env.OPENCODE_V2_BIN || path.join(repo, "node_modules/@opencode/cli/bin/opencode.exe")
const env = { ...process.env, OPENCODE_PASSWORD: randomUUID(), XDG_CONFIG_HOME: path.join(root, "xdg"),
  XDG_DATA_HOME: path.join(root, "data"), XDG_STATE_HOME: path.join(root, "state"),
  XDG_CACHE_HOME: path.join(root, "cache"), OPENCODE_DISABLE_MODELS_FETCH: "1" }
let server
let serverLog = ""
try {
  const { stdout: packed } = await exec("npm", ["pack", "--ignore-scripts", "--json", "--pack-destination", root], { cwd: repo, timeout: 60000 })
  const tarball = path.join(root, JSON.parse(packed)[0].filename)
  const installed = path.join(root, "installed")
  await exec("npm", ["install", "--prefix", installed, "--ignore-scripts", "--omit=dev", "--no-audit", "--no-fund", tarball], { cwd: root, timeout: 60000, maxBuffer: 4 * 1024 * 1024 })
  const pluginDirectory = path.join(installed, "node_modules/context-goblin/dist/src")
  const probe = path.join(root, "probe")
  const evidence = path.join(root, "tool-evidence.json")
  await fs.mkdir(probe)
  await fs.writeFile(path.join(probe, "index.js"), `
import fs from "node:fs/promises"
export default { id: "context-goblin.smoke-probe", async setup(ctx) {
  const tools = (await ctx.tool.list()).filter(tool => tool.name.startsWith("context_goblin_"))
  if (tools.length !== 6) throw new Error("Expected all six Context Goblin tools")
  const session = await ctx.session.create({ title: "No-model integration smoke" })
  try {
    for (const tool of tools) {
      const result = await tool.execute({}, { sessionID: session.id, agent: "build", messageID: "smoke", id: "smoke", signal: new AbortController().signal, progress: async () => {} })
      if (typeof result.content !== "string") throw new Error("Missing text result: " + tool.name)
    }
    await fs.writeFile(${JSON.stringify(evidence)}, JSON.stringify({ tools: tools.map(tool => tool.name) }))
  } finally { await ctx.session.remove({ sessionID: session.id }) }
} }
`)
  await fs.writeFile(path.join(root, "opencode.json"), JSON.stringify({
    plugins: [pluginDirectory, probe],
  }))
  server = spawn(binary, ["serve", "--hostname", "127.0.0.1", "--port", "0", "--print-logs"], { cwd: root, env, stdio: ["ignore", "pipe", "pipe"] })
  server.stderr.on("data", (chunk) => { serverLog += chunk })
  const url = await new Promise((resolve, reject) => {
    let output = ""
    const timer = setTimeout(() => reject(new Error(`V2 server startup timed out: ${output}`)), 30000)
    const consume = (chunk) => {
      output += chunk
      const match = output.match(/http:\/\/127\.0\.0\.1:\d+/)
      if (match) { clearTimeout(timer); resolve(match[0]) }
    }
    server.stdout.on("data", consume)
    server.stderr.on("data", consume)
    server.once("error", (error) => { clearTimeout(timer); reject(error) })
    server.once("exit", (code) => { clearTimeout(timer); reject(new Error(`V2 server exited ${code}: ${output}`)) })
  })
  const run = async (...args) => {
    const { stdout, stderr } = await exec(binary, [...args, "--server", url, "--param", `location.directory=${root}`], { cwd: root, env, timeout: 60000, maxBuffer: 4 * 1024 * 1024 })
    if (stderr) process.stderr.write(stderr)
    return JSON.parse(stdout)
  }
  let plugins
  for (let attempt = 0; attempt < 30; attempt++) {
    plugins = await run("api", "plugin.list")
    if (plugins.data?.some((plugin) => plugin.id === "context-goblin" && plugin.state?.status === "active")) break
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  console.log(JSON.stringify(plugins.data?.filter((plugin) => plugin.source?.type !== "builtin")))
  assert(Array.isArray(plugins.data) && plugins.data.some((plugin) => plugin.id === "context-goblin" && plugin.state?.status === "active"), "V2 did not activate Context Goblin")
  const commands = await run("api", "command.list")
  for (const name of ["context-goblin-stats", "context-goblin-usage"]) {
    assert(JSON.stringify(commands).includes(name), `V2 did not register ${name}`)
  }
  for (let attempt = 0; attempt < 30; attempt++) {
    try { await fs.access(evidence); break } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  const executed = JSON.parse(await fs.readFile(evidence, "utf8"))
  assert.equal(executed.tools.length, 6)
  console.log("Context Goblin OpenCode V2 packed-package smoke passed: active plugin, two commands, six executed tools (no model calls)")
} finally {
  if (serverLog) console.error(serverLog.split("\n").filter((line) => /ERROR|WARN/.test(line)).join("\n"))
  if (server && server.exitCode === null) {
    const exited = new Promise((resolve) => server.once("exit", resolve))
    server.kill("SIGTERM")
    const timer = setTimeout(() => server.kill("SIGKILL"), 2000)
    await exited
    clearTimeout(timer)
  }
  await fs.rm(root, { recursive: true, force: true })
}
