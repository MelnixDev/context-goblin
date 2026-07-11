import type { ContextGoblinPluginOptions, OutputCompactionOptions } from "./types.js"

export interface ResolvedPluginOptions {
  outputCompaction: OutputCompactionOptions
}

function numberOption(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

function stringArrayOption(value: unknown): string[] | undefined {
  return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : undefined
}

export function resolvePluginOptions(options: Record<string, unknown> | undefined): ResolvedPluginOptions {
  const typed = options as ContextGoblinPluginOptions | undefined
  return {
    outputCompaction: {
      enabled: typed?.compactToolOutputs !== false,
      thresholdChars: numberOption(typed?.compactToolOutputThresholdChars),
      keepStartChars: numberOption(typed?.compactToolOutputKeepStartChars),
      keepEndChars: numberOption(typed?.compactToolOutputKeepEndChars),
      tools: stringArrayOption(typed?.compactToolOutputTools),
    },
  }
}
