import type { Event } from "@opencode-ai/sdk"

import { recordUsageStep, tokensFromUnknown } from "../usage/store.js"

export function usageEventHook(root: string) {
  return async (input: { event: Event }) => {
    if (input.event.type !== "message.part.updated") return

    const part = input.event.properties.part
    if (part.type !== "step-finish") return

    const tokens = tokensFromUnknown(part.tokens)
    if (!tokens) return

    await recordUsageStep(root, {
      timestamp: Date.now(),
      sessionID: part.sessionID,
      tokens,
      cost: part.cost,
    })
  }
}
