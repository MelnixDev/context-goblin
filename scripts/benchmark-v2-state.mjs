import fs from "node:fs"
import path from "node:path"
import { parseLines, measureV2 } from "./benchmark-v2-metrics.mjs"

export function validateIdentity(stored, expected) {
  for (const key of Object.keys(expected)) {
    if (JSON.stringify(stored[key]) !== JSON.stringify(expected[key])) {
      throw new Error("Cannot resume benchmark: changed " + key)
    }
  }
}

export function quotaReset(raw) {
  for (const event of parseLines(raw)) {
    if (event.type !== "error" || event.error?.type !== "provider.quota") continue
    try {
      const body = JSON.parse(event.error.response?.body || "{}")
      const reset = body.error?.resets_at ?? body.resets_at
      if (Number.isFinite(reset)) return reset * 1000
    } catch {}
  }
}

export function loadCompletedArm(runRoot, model, mode) {
  const prefix = path.join(runRoot, model.replace(/[^a-z0-9.-]/gi, "-") + "." + mode)
  if (!fs.existsSync(prefix + ".result.json")) return
  const result = JSON.parse(fs.readFileSync(prefix + ".result.json", "utf8"))
  if (!result.ok) return
  if (result.model !== model || result.mode !== mode || !fs.existsSync(result.root)) {
    throw new Error("Cannot reuse completed arm: metadata or fixture missing")
  }
  const records = parseLines(fs.readFileSync(prefix + ".observations.jsonl", "utf8"))
  const metrics = measureV2(records, fs.realpathSync(result.root))
  if (metrics.errors.length || JSON.stringify(metrics) !== JSON.stringify(result.metrics)) {
    throw new Error("Cannot reuse completed arm: raw observations changed")
  }
  const cli = parseLines(fs.readFileSync(prefix + ".events.jsonl", "utf8"))
  const text = cli.filter((event) => event.type === "text" || event.part?.type === "text")
    .map((event) => event.part?.text || event.text || event.data?.text || "").join("\n")
  if (text !== result.text || cli.some((event) => event.type === "error")) {
    throw new Error("Cannot reuse completed arm: CLI evidence changed")
  }
  return result
}
