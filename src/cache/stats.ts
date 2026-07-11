import type { CacheStats } from "./types.js"
import type { CodeMap } from "../context/codeMap.js"

export function buildCacheStats(input: { markdown: string; directoryMap: string[]; codeMap: CodeMap; sections: string[] }): CacheStats {
  return {
    cacheBytes: Buffer.byteLength(input.markdown),
    cacheLines: input.markdown.split("\n").length,
    directoryEntries: input.directoryMap.length,
    codeMapFiles: input.codeMap.files.length,
    codeMapEntries: input.codeMap.entries.length,
    sections: input.sections,
  }
}
