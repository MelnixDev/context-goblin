import type { TuiPluginModule } from "@opencode-ai/plugin/tui"

import { tui } from "./plugin/tui.js"

export { tui }

export default {
  id: "context-goblin",
  tui,
} satisfies TuiPluginModule
