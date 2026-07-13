import type { Plugin } from "@opencode-ai/plugin"

import { compactToolOutputAfterHook } from "./hooks.js"
import { registerContextGoblinCommands } from "./commands.js"
import { resolvePluginOptions } from "./options.js"
import { createContextGoblinTools } from "./tools.js"

export const ContextGoblin: Plugin = async (_input, options) => {
  const pluginOptions = resolvePluginOptions(options)
  return {
    config: async (config) => {
      registerContextGoblinCommands(config)
    },
    "tool.execute.after": compactToolOutputAfterHook(pluginOptions.outputCompaction),
    tool: createContextGoblinTools(),
  }
}
