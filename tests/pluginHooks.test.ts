import { describe, expect, it } from "vitest"

import { compactToolOutputAfterHook } from "../src/plugin/hooks.js"

describe("plugin hooks", () => {
  it("leaves non-string OpenCode and MCP outputs untouched", async () => {
    const output = { content: [{ type: "text", text: "raw MCP result" }], metadata: {} }
    const hook = compactToolOutputAfterHook({ enabled: true })

    await expect(hook({ tool: "mcp_tool", args: {} }, output)).resolves.toBeUndefined()
    expect(output.content[0]?.text).toBe("raw MCP result")
  })

  it("does not compact native output unless explicitly enabled", async () => {
    const output = { output: "x".repeat(20_000), metadata: {} }
    const hook = compactToolOutputAfterHook({ enabled: false })

    await hook({ tool: "bash", args: { command: "git diff" } }, output)
    expect(output.output).toHaveLength(20_000)
  })
})
