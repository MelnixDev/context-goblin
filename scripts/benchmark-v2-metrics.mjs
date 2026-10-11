import path from "node:path"

export function parseLines(raw) {
  return raw.split("\n").filter(Boolean).map((line) => JSON.parse(line))
}

export function measureV2(records, root) {
  const seen = new Set()
  const files = new Set()
  const tools = {}
  const tokens = { input: 0, output: 0, reasoning: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
  let steps = 0, cost = 0, secretLeak = false
  const errors = []
  for (const record of records) {
    if (record.type === "observer-error") errors.push(record.message)
    if (record.type === "tool") {
      const key = "tool:" + record.sessionID + ":" + record.id
      if (seen.has(key)) continue
      seen.add(key)
      tools[record.tool] = (tools[record.tool] || 0) + 1
      secretLeak ||= record.secretLeak === true
      if (record.status !== "completed") errors.push("Tool failed: " + record.tool)
      if (record.tool === "read" && record.status === "completed") {
        collectFiles(record.input, root, files)
      }
    }
    if (record.type === "step") {
      const key = "step:" + record.id
      if (seen.has(key)) continue
      seen.add(key)
      const t = record.tokens
      const values = [t?.input, t?.output, t?.reasoning, t?.cache?.read, t?.cache?.write]
      if (!values.every((n) => Number.isFinite(n) && n >= 0)) {
        errors.push("Missing or invalid step token counters")
        continue
      }
      steps++
      tokens.input += t.input
      tokens.output += t.output
      tokens.reasoning += t.reasoning
      tokens.cacheRead += t.cache.read
      tokens.cacheWrite += t.cache.write
      // Session step counters are disjoint: output is visible output, and
      // input excludes cache reads/writes. Do not add aggregate usage events.
      tokens.total += values.reduce((a, b) => a + b, 0)
      cost += Number.isFinite(record.cost) ? record.cost : 0
      if (record.finish === "error" || record.finish === "length") errors.push("Incomplete model step: " + record.finish)
    }
  }
  if (!steps) errors.push("No completed model steps with token counters")
  return { files: [...files].sort(), tools, tokens, steps, cost, secretLeak, errors }
}

function collectFiles(value, root, files) {
  if (!value) return
  if (typeof value === "string") {
    const candidate = value.replace(/^file:\/\//, "")
    const relative = path.relative(root, path.resolve(root, candidate)).split(path.sep).join("/")
    if (relative && !relative.startsWith("../") && !path.isAbsolute(relative)) files.add(relative)
  } else if (Array.isArray(value)) {
    for (const item of value) collectFiles(item, root, files)
  } else if (typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (/file|path/i.test(key)) collectFiles(item, root, files)
    }
  }
}

export function answerCoverage(text) {
  return [
    /cartStore/i, /CartDrawer/i, /ProductCard|ProductList/i,
    /test|vitest/i, /risk/i, /\.env|secret|safety|exclusion/i,
  ].filter((pattern) => pattern.test(text)).length
}

export function metricChange(before, after) {
  return before > 0 ? { reduction: Math.round((before - after) / before * 100),
    status: after < before ? "pass" : after === before ? "flat" : "fail" }
    : { reduction: null, status: "unavailable" }
}
