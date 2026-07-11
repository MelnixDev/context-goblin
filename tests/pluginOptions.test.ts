import { describe, expect, it } from "vitest"

import { resolvePluginOptions } from "../src/pluginOptions.js"

describe("plugin options", () => {
  it("ignores invalid compaction options and leaves defaults resolvable", () => {
    const options = resolvePluginOptions({
      compactToolOutputThresholdChars: "12000",
      compactToolOutputTools: ["bash", 42],
    })

    expect(options.outputCompaction).toEqual({
      enabled: true,
      thresholdChars: undefined,
      keepStartChars: undefined,
      keepEndChars: undefined,
      tools: undefined,
    })
  })

  it("allows disabling output compaction", () => {
    const options = resolvePluginOptions({ compactToolOutputs: false })

    expect(options.outputCompaction.enabled).toBe(false)
  })
})
