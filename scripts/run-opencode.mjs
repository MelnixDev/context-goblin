import { spawn } from "node:child_process"

const [binary, ...args] = process.argv.slice(2)
const timeoutMs = Number(process.env.OPENCODE_TIMEOUT_MS || 180_000)
if (!binary || !Number.isFinite(timeoutMs) || timeoutMs <= 0) {
  console.error("Usage: node scripts/run-opencode.mjs <OpenCode binary> [...args]; OPENCODE_TIMEOUT_MS must be positive")
  process.exit(1)
}

const child = spawn(binary, args, { stdio: ["ignore", "pipe", "inherit"], detached: process.platform !== "win32" })
let stopped = false
let failureCode = 0
let pending = ""
let killTimer

function signalChild(signal) {
  try {
    if (process.platform === "win32") child.kill(signal)
    else process.kill(-child.pid, signal)
  } catch {}
}

function stop(code, message) {
  if (stopped) return
  stopped = true
  failureCode = code
  if (message) console.error(message)
  signalChild("SIGTERM")
  killTimer = setTimeout(() => signalChild("SIGKILL"), 2_000)
}

const timeout = setTimeout(() => stop(124, `OpenCode timed out after ${timeoutMs}ms`), timeoutMs)
process.on("SIGINT", () => stop(130))
process.on("SIGTERM", () => stop(143))
child.stdout.setEncoding("utf8")
child.stdout.on("data", (chunk) => {
  process.stdout.write(chunk)
  pending += chunk
  const lines = pending.split("\n")
  pending = lines.pop() || ""
  for (const line of lines) {
    try {
      const record = JSON.parse(line)
      if (record.type === "error") stop(1, "OpenCode emitted an error; stopping this run")
    } catch {}
  }
})
child.on("error", (error) => {
  failureCode = 1
  console.error(`Could not start OpenCode: ${error.message}`)
})
child.on("close", (code) => {
  clearTimeout(timeout)
  clearTimeout(killTimer)
  process.exitCode = failureCode || (code === null ? 1 : code)
})
