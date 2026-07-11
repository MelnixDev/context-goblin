import type { CompactToolOutputInput, CompactToolOutputResult, OutputCompactionOptions, ResolvedOutputCompactionOptions } from "./types.js"

const defaultOptions: ResolvedOutputCompactionOptions = {
  enabled: true,
  thresholdChars: 12_000,
  keepStartChars: 4_000,
  keepEndChars: 2_000,
  tools: ["bash", "grep", "glob"],
}

export function resolveOutputCompactionOptions(options: OutputCompactionOptions = {}): ResolvedOutputCompactionOptions {
  return {
    enabled: options.enabled ?? defaultOptions.enabled,
    thresholdChars: options.thresholdChars ?? defaultOptions.thresholdChars,
    keepStartChars: options.keepStartChars ?? defaultOptions.keepStartChars,
    keepEndChars: options.keepEndChars ?? defaultOptions.keepEndChars,
    tools: options.tools ?? defaultOptions.tools,
  }
}

function commandFromArgs(args: unknown): string | undefined {
  if (!args || typeof args !== "object") return undefined
  const command = (args as { command?: unknown }).command
  return typeof command === "string" ? command : undefined
}

function lineCount(text: string): number {
  if (!text) return 0
  return text.split("\n").length
}

export function compactToolOutput(input: CompactToolOutputInput, options: OutputCompactionOptions = {}): CompactToolOutputResult {
  const config = resolveOutputCompactionOptions(options)
  const originalChars = input.output.length
  if (!config.enabled || !config.tools.includes(input.tool) || originalChars <= config.thresholdChars) {
    return { output: input.output, compacted: false, originalChars, compactedChars: originalChars, omittedChars: 0 }
  }

  const keepStartChars = Math.max(0, config.keepStartChars)
  const keepEndChars = Math.max(0, config.keepEndChars)
  const omittedChars = Math.max(0, originalChars - keepStartChars - keepEndChars)
  const command = commandFromArgs(input.args)
  const start = input.output.slice(0, keepStartChars).trimEnd()
  const end = input.output.slice(Math.max(0, originalChars - keepEndChars)).trimStart()
  const header = [
    `[Context Goblin compacted oversized ${input.tool} output]`,
    `Original: ${originalChars} chars, ${lineCount(input.output)} lines. Kept first ${keepStartChars} chars and last ${keepEndChars} chars.`,
    command ? `Command: ${command}` : undefined,
    "Reason: reduce LLM context spent on bulky tool output. Rerun a focused command if exact omitted output is required.",
    "",
    "--- output start ---",
  ].filter((line): line is string => line !== undefined).join("\n")
  const middle = `\n--- omitted ${omittedChars} chars ---\n`
  const footer = "\n--- output end ---"
  const output = `${header}\n${start}${middle}${end}${footer}`

  return {
    output,
    compacted: true,
    originalChars,
    compactedChars: output.length,
    omittedChars,
  }
}
