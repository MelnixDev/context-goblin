import type { Plugin } from "@opencode-ai/plugin"

import { compactToolOutputAfterHook } from "./hooks.js"
import { registerContextGoblinCommands } from "./commands.js"
import { usageEventHook } from "./events.js"
import { resolvePluginOptions } from "./options.js"
import { createContextGoblinTools } from "./tools.js"

export const ContextGoblin: Plugin = async (input, options) => {
  const pluginOptions = resolvePluginOptions(options)
  const root = input.directory || input.worktree || process.cwd()
  return {
    config: async (config) => {
      registerContextGoblinCommands(config)
    },
    event: usageEventHook(root),
    "tool.execute.after": compactToolOutputAfterHook(pluginOptions.outputCompaction),
    tool: createContextGoblinTools(),
  }
}
