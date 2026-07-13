import { describe, expect, it } from "vitest"

import { registerContextGoblinCommands, statsCommand, statsCommandName } from "../src/plugin/commands.js"
import type { Config } from "@opencode-ai/plugin"

describe("plugin commands", () => {
  it("registers the native OpenCode stats slash command", () => {
    const config = {} as Config

    registerContextGoblinCommands(config)

    expect(config.command?.[statsCommandName]).toEqual(statsCommand)
    expect(config.command?.[statsCommandName]?.template).toContain("context_goblin_status")
    expect(config.command?.[statsCommandName]?.template).toContain("context_goblin_stats")
  })

  it("does not overwrite a user-defined command", () => {
    const existing = { description: "Custom", template: "Custom template" }
    const config = { command: { [statsCommandName]: existing } } as Config

    registerContextGoblinCommands(config)

    expect(config.command?.[statsCommandName]).toBe(existing)
  })
})
