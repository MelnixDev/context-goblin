import fs from "node:fs/promises"
import path from "node:path"

import { isDeniedPath } from "../security.js"
import { readTextIfAllowed } from "./fileAccess.js"

const codeFilePattern = /\.(?:[cm]?[jt]sx?|vue|svelte)$/
const maxCodeMapFiles = 40
const maxCodeMapCandidates = 400

export interface CodeMap {
  entries: string[]
  files: string[]
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

export async function buildCodeMap(rootDir: string, entryPoints: string[]): Promise<CodeMap> {
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
