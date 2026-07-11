import type { Plugin } from "@opencode-ai/plugin"

import { compactToolOutputAfterHook } from "./hooks.js"
import { resolvePluginOptions } from "./options.js"
import { createContextGoblinTools } from "./tools.js"

export const ContextGoblin: Plugin = async (_input, options) => {
  const pluginOptions = resolvePluginOptions(options)
  return {
    "tool.execute.after": compactToolOutputAfterHook(pluginOptions.outputCompaction),
    tool: createContextGoblinTools(),
  }
}
