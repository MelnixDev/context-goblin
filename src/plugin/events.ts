import { recordUsageStep, tokensFromUnknown } from "../usage/store.js"

export function usageEventHook(root: string) {
  return async (input: { event: unknown }) => {
    const event = input.event as {
      type?: string
      timestamp?: number
      sessionID?: string
      part?: { tokens?: unknown; cost?: number }
    }

    if (event.type !== "step_finish") return
    const tokens = tokensFromUnknown(event.part?.tokens)
    if (!tokens) return

    await recordUsageStep(root, {
      timestamp: event.timestamp ?? Date.now(),
      sessionID: event.sessionID,
      tokens,
      cost: event.part?.cost,
    })
  }
}
