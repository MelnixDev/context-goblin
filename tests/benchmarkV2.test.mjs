import { describe, expect, it } from "vitest"
import { measureV2, metricChange, parseLines } from "../scripts/benchmark-v2-metrics.mjs"
import { validateIdentity, quotaReset } from "../scripts/benchmark-v2-state.mjs"

const step = { type: "step", id: "s1", tokens: { input: 100, output: 20, reasoning: 30, cache: { read: 50, write: 5 } }, cost: 0.01 }
describe("V2 benchmark accounting", () => {
  it("sums disjoint step counters once and ignores aggregate updates", () => {
    const measured = measureV2([step, step, { ...step, type: "session.usage.updated", id: "aggregate" }], "/fixture")
    expect(measured.tokens).toEqual({ input: 100, output: 20, reasoning: 30, cacheRead: 50, cacheWrite: 5, total: 205 })
    expect(measured.steps).toBe(1)
  })
  it("counts distinct completed read paths, including calls observed inside codemode", () => {
    const calls = ["src/a.ts", "src/a.ts", "/fixture/src/b.ts"].map((filePath, i) =>
      ({ type: "tool", tool: "read", id: String(i), sessionID: "s", status: "completed", input: { filePath } }))
    const measured = measureV2([step, ...calls, calls[0],
      { type: "tool", tool: "codemode", id: "c", sessionID: "s", status: "completed", input: { script: "read" } }], "/fixture")
    expect(measured.files).toEqual(["src/a.ts", "src/b.ts"])
    expect(measured.tools).toEqual({ read: 3, codemode: 1 })
  })
  it("does not turn absent, invalid, or truncated token usage into a successful zero run", () => {
    expect(measureV2([], "/fixture").errors).not.toHaveLength(0)
    expect(measureV2([{ ...step, tokens: { input: 10 } }], "/fixture").errors).not.toHaveLength(0)
    expect(measureV2([{ ...step, finish: "length" }], "/fixture").errors).not.toHaveLength(0)
  })
  it("reports failed tools and detected secrets", () => {
    const measured = measureV2([step, { type: "tool", tool: "read", id: "t", status: "error", secretLeak: true }], "/fixture")
    expect(measured.errors).toContain("Tool failed: read")
    expect(measured.secretLeak).toBe(true)
  })
  it("classifies increased, flat, and absent baselines without claiming savings", () => {
    expect(metricChange(100, 125)).toEqual({ reduction: -25, status: "fail" })
    expect(metricChange(100, 100).status).toBe("flat")
    expect(metricChange(0, 10).status).toBe("unavailable")
  })
  it("rejects malformed raw evidence", () => {
    expect(() => parseLines("not-json")).toThrow()
  })
  it("rejects resumed evidence from changed versions, models, or measurement code", () => {
    const identity = { packageVersion: "0.2.2", models: ["openai/gpt-6-sol"], metricsHash: "hash" }
    expect(() => validateIdentity(identity, identity)).not.toThrow()
    for (const changed of [{ ...identity, packageVersion: "0.2.3" },
      { ...identity, models: ["openai/gpt-6.1-sol"] }, { ...identity, metricsHash: "different" }]) {
      expect(() => validateIdentity(identity, changed)).toThrow("Cannot resume benchmark")
    }
  })
  it("extracts a provider quota reset without treating ordinary errors as quota failures", () => {
    const raw = JSON.stringify({ type: "error", error: { type: "provider.quota",
      response: { body: JSON.stringify({ error: { resets_at: 1791737893 } }) } } })
    expect(quotaReset(raw)).toBe(1791737893000)
    expect(quotaReset(JSON.stringify({ type: "error", error: { type: "unknown" } }))).toBeUndefined()
  })
})
