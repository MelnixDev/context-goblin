import type { TuiPluginModule } from "@opencode-ai/plugin/tui"

import { tui } from "./plugin/tui.js"
import { setupTuiV2 } from "./plugin/tuiV2.js"

export { tui }

export default {
  id: "context-goblin",
  tui,
  setup: setupTuiV2,
} satisfies TuiPluginModule & { setup: typeof setupTuiV2 }
