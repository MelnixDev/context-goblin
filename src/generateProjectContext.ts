import fs from "node:fs/promises"
import path from "node:path"

import { CACHE_MARKDOWN, CACHE_STATE, CACHE_VERSION, DEFAULT_MAX_CACHE_KB, SAFETY_EXCLUSIONS } from "./constants.js"
import { detectStack } from "./detectStack.js"
import { hashProjectState } from "./hashProjectState.js"
import { isDeniedPath, redactSecrets } from "./security.js"
import { truncateMarkdown } from "./truncateMarkdown.js"
import type { ContextGoblinOptions, ProjectState } from "./types.js"

async function listDirectoryMap(rootDir: string, dir = ".", depth = 0): Promise<string[]> {
  if (depth > 2) return []
  const absoluteDir = path.join(rootDir, dir)
  let entries: string[] = []
  try {
    const dirents = await fs.readdir(absoluteDir, { withFileTypes: true })
    for (const dirent of dirents.sort((a, b) => a.name.localeCompare(b.name))) {
      const relativePath = dir === "." ? dirent.name : `${dir}/${dirent.name}`
      if (isDeniedPath(relativePath)) continue
      entries.push(`${"  ".repeat(depth)}- ${dirent.name}${dirent.isDirectory() ? "/" : ""}`)
      if (dirent.isDirectory()) entries = entries.concat(await listDirectoryMap(rootDir, relativePath, depth + 1))
      if (entries.length >= 120) {
        entries.push(`${"  ".repeat(depth)}- ...`)
        return entries
      }
    }
  } catch {
    return []
  }
  return entries
}

async function readTextIfAllowed(rootDir: string, relativePath: string): Promise<string | undefined> {
  if (isDeniedPath(relativePath)) return undefined
  try {
    return redactSecrets(await fs.readFile(path.join(rootDir, relativePath), "utf8"))
  } catch {
    return undefined
  }
}

function formatScripts(scripts: Record<string, string>): string {
  const entries = Object.entries(scripts)
  if (entries.length === 0) return "- [NEEDS INPUT] No package scripts detected."
  return entries.map(([name, command]) => `- ${name}: \`${command}\``).join("\n")
}

export async function generateProjectContext(options: ContextGoblinOptions): Promise<ProjectState> {
  const rootDir = options.rootDir
  const maxCacheKb = options.maxCacheKb ?? DEFAULT_MAX_CACHE_KB
  const stack = await detectStack(rootDir)
  const projectHash = await hashProjectState(rootDir)
  const directoryMap = await listDirectoryMap(rootDir)
  const agents = await readTextIfAllowed(rootDir, "AGENTS.md")

  const markdown = truncateMarkdown(redactSecrets(`# Context Goblin Project Cache

Generated: ${new Date().toISOString()}
Version: ${CACHE_VERSION}

## Detected Stack

- Package manager: ${stack.packageManager}
- Languages: ${stack.languages.length ? stack.languages.join(", ") : "[NEEDS INPUT]"}
- Frameworks: ${stack.frameworks.length ? stack.frameworks.join(", ") : "[NEEDS INPUT]"}
- Entry points: ${stack.entryPoints.length ? stack.entryPoints.join(", ") : "[NEEDS INPUT]"}
- Notes: ${stack.notes.length ? stack.notes.join("; ") : "none"}

## Important Commands

${formatScripts(stack.scripts)}

## Directory Map

${directoryMap.length ? directoryMap.join("\n") : "- [NEEDS INPUT] No readable project files detected."}

## Safety Exclusions

${SAFETY_EXCLUSIONS.map((item) => `- ${item}`).join("\n")}

Denied paths are summarized only. Their contents are not read into this cache.

## Agent Instructions

Before scanning broad repository files:

1. Read this cache.
2. Inspect only the smallest file set needed for the task.
3. Never read denied paths or secret-looking files.

${agents ? `### Existing AGENTS.md\n\n${agents}` : "No AGENTS.md found."}
`), maxCacheKb)

  await fs.mkdir(path.join(rootDir, path.dirname(CACHE_MARKDOWN)), { recursive: true })
  await fs.writeFile(path.join(rootDir, CACHE_MARKDOWN), markdown)

  const state: ProjectState = {
    version: CACHE_VERSION,
    generatedAt: new Date().toISOString(),
    projectHash: projectHash.hash,
    trackedFiles: projectHash.trackedFiles,
  }
  await fs.writeFile(path.join(rootDir, CACHE_STATE), `${JSON.stringify(state, null, 2)}\n`)
  return state
}
