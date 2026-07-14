import { describe, expect, it } from "vitest"

import { registerContextGoblinCommands, statsCommand, statsCommandName, usageCommand, usageCommandName } from "../src/plugin/commands.js"
import type { Config } from "@opencode-ai/plugin"

describe("plugin commands", () => {
  it("registers the native OpenCode stats slash command", () => {
    const config = {} as Config

    registerContextGoblinCommands(config)

    expect(config.command?.[statsCommandName]).toEqual(statsCommand)
    expect(config.command?.[statsCommandName]?.template).toContain("context_goblin_status")
    expect(config.command?.[statsCommandName]?.template).toContain("context_goblin_stats")
  })

  it("registers the native OpenCode usage slash command", () => {
    const config = {} as Config

    registerContextGoblinCommands(config)

    expect(config.command?.[usageCommandName]).toEqual(usageCommand)
    expect(config.command?.[usageCommandName]?.template).toContain("context_goblin_usage_stats")
    expect(config.command?.[usageCommandName]?.template).toContain("not guaranteed provider billing totals")
  })

  it("does not overwrite a user-defined command", () => {
    const existingStats = { description: "Custom stats", template: "Custom stats template" }
    const existingUsage = { description: "Custom usage", template: "Custom usage template" }
    const config = { command: { [statsCommandName]: existingStats, [usageCommandName]: existingUsage } } as Config

    registerContextGoblinCommands(config)

    expect(config.command?.[statsCommandName]).toBe(existingStats)
    expect(config.command?.[usageCommandName]).toBe(existingUsage)
  })
})
