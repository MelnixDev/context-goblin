import { compactToolOutput } from "../compaction/outputCompaction.js"
import type { OutputCompactionOptions } from "../compaction/types.js"

export function compactToolOutputAfterHook(outputCompaction: OutputCompactionOptions) {
  return async (input: { tool: string; args: unknown }, output: { output: string; metadata: unknown }) => {
    const compacted = compactToolOutput({ tool: input.tool, args: input.args, output: output.output }, outputCompaction)
    if (!compacted.compacted) return
    output.output = compacted.output
    output.metadata = {
      ...(typeof output.metadata === "object" && output.metadata ? output.metadata : {}),
      contextGoblinOutputCompaction: {
        originalChars: compacted.originalChars,
        compactedChars: compacted.compactedChars,
        omittedChars: compacted.omittedChars,
      },
    }
  }
}
