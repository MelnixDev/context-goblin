import fs from "node:fs/promises"
import path from "node:path"

import { CACHE_MARKDOWN, CACHE_STATE, CACHE_VERSION, DEFAULT_MAX_CACHE_KB } from "../constants.js"
import { detectStack } from "../project/detectStack.js"
import { hashProjectState } from "../project/hashProjectState.js"
import { buildCodeMap } from "../context/codeMap.js"
import { listDirectoryMap } from "../context/directoryMap.js"
import { readTextIfAllowed } from "../context/fileAccess.js"
import { contextSections, renderProjectContextMarkdown } from "../context/markdown.js"
import { redactSecrets } from "../security.js"
import { truncateMarkdown } from "../truncateMarkdown.js"
import type { ContextGoblinOptions, ProjectState } from "./types.js"
import { buildCacheStats } from "./stats.js"

export async function generateProjectContext(options: ContextGoblinOptions): Promise<ProjectState> {
  const rootDir = options.rootDir
  const maxCacheKb = options.maxCacheKb ?? DEFAULT_MAX_CACHE_KB
  const stack = await detectStack(rootDir)
  const projectHash = await hashProjectState(rootDir)
  const directoryMap = await listDirectoryMap(rootDir)
  const codeMap = await buildCodeMap(rootDir, stack.entryPoints)
  const agents = await readTextIfAllowed(rootDir, "AGENTS.md")
  const generatedAt = new Date().toISOString()

  const markdown = truncateMarkdown(redactSecrets(renderProjectContextMarkdown({ generatedAt, stack, directoryMap, codeMap, agents })), maxCacheKb)
  const stats = buildCacheStats({ markdown, directoryMap, codeMap, sections: contextSections() })

  await fs.mkdir(path.join(rootDir, path.dirname(CACHE_MARKDOWN)), { recursive: true })
  await fs.writeFile(path.join(rootDir, CACHE_MARKDOWN), markdown)

  const state: ProjectState = {
    version: CACHE_VERSION,
    generatedAt,
    projectHash: projectHash.hash,
    trackedFiles: projectHash.trackedFiles,
    stats,
  }
  await fs.writeFile(path.join(rootDir, CACHE_STATE), `${JSON.stringify(state, null, 2)}\n`)
  return state
}
