import fs from "node:fs/promises"
import path from "node:path"

import { CACHE_MARKDOWN, CACHE_STATE, CACHE_VERSION, DEFAULT_MAX_CACHE_KB, SAFETY_EXCLUSIONS } from "./constants.js"
import { detectStack } from "./detectStack.js"
import { hashProjectState } from "./hashProjectState.js"
import { isDeniedPath, redactSecrets } from "./security.js"
import { truncateMarkdown } from "./truncateMarkdown.js"
import type { CacheStats, ContextGoblinOptions, ProjectState } from "./types.js"

const codeFilePattern = /\.(?:[cm]?[jt]sx?|vue|svelte)$/
const maxCodeMapFiles = 40
const maxCodeMapCandidates = 400

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

async function listCodeFiles(rootDir: string, dir = "."): Promise<string[]> {
  const absoluteDir = path.join(rootDir, dir)
  const files: string[] = []
  try {
    const dirents = await fs.readdir(absoluteDir, { withFileTypes: true })
    for (const dirent of dirents.sort((a, b) => a.name.localeCompare(b.name))) {
      const relativePath = dir === "." ? dirent.name : `${dir}/${dirent.name}`
      if (isDeniedPath(relativePath)) continue
      if (dirent.isDirectory()) files.push(...await listCodeFiles(rootDir, relativePath))
      else if (codeFilePattern.test(relativePath)) files.push(relativePath)
      if (files.length >= maxCodeMapCandidates) return files.slice(0, maxCodeMapCandidates)
    }
  } catch {
    return []
  }
  return files
}

function rankCodeFiles(files: string[], entryPoints: string[]): string[] {
  const entryPointSet = new Set(entryPoints)
  return files.sort((a, b) => codeFileScore(b, entryPointSet) - codeFileScore(a, entryPointSet) || a.localeCompare(b))
}

function codeFileScore(file: string, entryPoints: Set<string>): number {
  let score = 0
  if (entryPoints.has(file)) score += 100
  if (/\b(src|app)\//.test(file)) score += 20
  if (/\b(features|routes?|pages|app|api|components|stores?|state)\b/i.test(file)) score += 20
  if (/\b(test|tests|spec)\b|\.(test|spec)\./i.test(file)) score += 12
  if (/\b(index|main|app)\.[cm]?[jt]sx?$/i.test(file)) score += 10
  if (/\.(tsx|jsx)$/.test(file)) score += 5
  return score
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))]
}

function extractMatches(input: string, pattern: RegExp, limit = 8): string[] {
  return unique([...input.matchAll(pattern)].map((match) => match[1])).slice(0, limit)
}

function summarizeCodeFile(relativePath: string, text: string): string[] {
  const imports = extractMatches(text, /^import\s+(?:.+?\s+from\s+)?["'](.+?)["']/gm, 6)
  const exports = unique([
    ...extractMatches(text, /^export\s+(?:async\s+)?(?:function|class|interface|type|const|let|var)\s+(\w+)/gm, 10),
    ...extractMatches(text, /^export\s*\{([^}]+)\}/gm, 4).flatMap((group) => group.split(",").map((item) => item.trim().split(" as ")[0]?.trim() ?? "")),
  ]).slice(0, 12)
  const components = extractMatches(text, /(?:export\s+)?function\s+([A-Z][A-Za-z0-9_]*)\s*\(/g, 8)
  const tests = extractMatches(text, /\b(?:describe|it|test)\s*\(\s*["'`](.+?)["'`]/g, 8)

  const lines = [`- ${relativePath}`]
  if (imports.length) lines.push(`  - imports: ${imports.join(", ")}`)
  if (exports.length) lines.push(`  - exports: ${exports.join(", ")}`)
  if (components.length) lines.push(`  - components: ${components.join(", ")}`)
  if (tests.length) lines.push(`  - tests: ${tests.join(", ")}`)
  return lines
}

async function buildCodeMap(rootDir: string, entryPoints: string[]): Promise<{ entries: string[]; files: string[] }> {
  const files = rankCodeFiles(await listCodeFiles(rootDir), entryPoints).slice(0, maxCodeMapFiles)
  const entries: string[] = []
  for (const file of files) {
    const text = await readTextIfAllowed(rootDir, file)
    if (!text) continue
    entries.push(...summarizeCodeFile(file, text))
    if (entries.length >= 180) {
      entries.push("- ...")
      break
    }
  }
  return { entries, files }
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
  const codeMap = await buildCodeMap(rootDir, stack.entryPoints)
  const agents = await readTextIfAllowed(rootDir, "AGENTS.md")
  const sections = ["Detected Stack", "Important Commands", "Directory Map", "Code Map", "Safety Exclusions", "Agent Instructions"]

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

## Code Map

${codeMap.entries.length ? codeMap.entries.join("\n") : "- [NEEDS INPUT] No source/test code facts detected."}

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

  const stats: CacheStats = {
    cacheBytes: Buffer.byteLength(markdown),
    cacheLines: markdown.split("\n").length,
    directoryEntries: directoryMap.length,
    codeMapFiles: codeMap.files.length,
    codeMapEntries: codeMap.entries.length,
    sections,
  }

  await fs.mkdir(path.join(rootDir, path.dirname(CACHE_MARKDOWN)), { recursive: true })
  await fs.writeFile(path.join(rootDir, CACHE_MARKDOWN), markdown)

  const state: ProjectState = {
    version: CACHE_VERSION,
    generatedAt: new Date().toISOString(),
    projectHash: projectHash.hash,
    trackedFiles: projectHash.trackedFiles,
    stats,
  }
  await fs.writeFile(path.join(rootDir, CACHE_STATE), `${JSON.stringify(state, null, 2)}\n`)
  return state
}
