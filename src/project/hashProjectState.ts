import crypto from "node:crypto"
import fs from "node:fs/promises"
import path from "node:path"
import { execFile } from "node:child_process"
import { promisify } from "node:util"

import { HASH_RELEVANT_FILES } from "../constants.js"
import { readTextIfAllowed, resolveAllowedFile } from "../context/fileAccess.js"
import { isDeniedPath } from "../security.js"
import type { HashResult } from "./types.js"

const execFileAsync = promisify(execFile)
const sourceFilePattern = /\.(?:[cm]?[jt]sx?|vue|svelte)$/i
const maxFallbackFiles = 2_000
const maxFallbackBytes = 32 * 1024 * 1024
const gitPathspec = [
  ".",
  ":(exclude).opencode/cache/context-goblin/**",
  ":(exclude)node_modules/**",
  ":(exclude)dist/**",
  ":(exclude)build/**",
  ":(exclude)coverage/**",
  ":(exclude).next/**",
  ":(exclude).nuxt/**",
  ":(exclude).output/**",
]

async function readIfExists(rootDir: string, relativePath: string): Promise<string | undefined> {
  return await readTextIfAllowed(rootDir, relativePath)
}

async function gitState(rootDir: string): Promise<string | undefined> {
  try {
    const options = { cwd: rootDir, maxBuffer: 16 * 1024 * 1024, timeout: 10_000 }
    const [branch, head, status, ignored] = await Promise.all([
      execFileAsync("git", ["rev-parse", "--abbrev-ref", "HEAD"], options),
      execFileAsync("git", ["rev-parse", "HEAD"], options),
      execFileAsync("git", ["status", "--porcelain=v1", "-z", "--untracked-files=all", "--", ...gitPathspec], options),
      execFileAsync("git", ["ls-files", "--others", "--ignored", "--exclude-standard", "-z", "--", ...gitPathspec], options),
    ])
    const changedPaths: string[] = []
    const records = status.stdout.split("\0").filter(Boolean)
    for (let index = 0; index < records.length; index += 1) {
      const record = records[index] ?? ""
      const statusCode = record.slice(0, 2)
      const relativePath = record.slice(3)
      if (relativePath) changedPaths.push(relativePath)
      if (statusCode.includes("R") || statusCode.includes("C")) index += 1
    }
    const workingTreeHashes: string[] = []
    for (const relativePath of changedPaths.sort()) {
      if (isDeniedPath(relativePath)) continue
      try {
        const safePath = await resolveAllowedFile(rootDir, relativePath)
        if (!safePath) {
          workingTreeHashes.push(`${relativePath}:[unreadable]`)
          continue
        }
        const content = await fs.readFile(safePath)
        workingTreeHashes.push(`${relativePath}:${crypto.createHash("sha256").update(content).digest("hex")}`)
      } catch {
        workingTreeHashes.push(`${relativePath}:[unreadable]`)
      }
    }
    const ignoredSourceHash = crypto.createHash("sha256")
    let ignoredFiles = 0
    let ignoredBytes = 0
    for (const relativePath of ignored.stdout.split("\0").filter(Boolean).sort()) {
      if (isDeniedPath(relativePath) || !sourceFilePattern.test(relativePath)) continue
      const safePath = await resolveAllowedFile(rootDir, relativePath)
      if (!safePath) continue
      ignoredFiles += 1
      ignoredBytes += (await fs.stat(safePath)).size
      if (ignoredFiles > maxFallbackFiles || ignoredBytes > maxFallbackBytes) return `unverifiable:${crypto.randomUUID()}`
      ignoredSourceHash.update(relativePath).update("\0").update(await fs.readFile(safePath)).update("\0")
    }
    return [
      `branch:${branch.stdout.trim()}`,
      `head:${head.stdout.trim()}`,
      `status:${status.stdout}`,
      `working-tree:${workingTreeHashes.join("\n")}`,
      `ignored-source:${ignoredSourceHash.digest("hex")}`,
    ].join("\n")
  } catch {
    return undefined
  }
}

async function nonGitSourceState(rootDir: string): Promise<string> {
  const hash = crypto.createHash("sha256")
  const directories = ["."]
  let files = 0
  let bytes = 0

  while (directories.length > 0) {
    const dir = directories.pop() ?? "."
    let entries
    try {
      entries = await fs.readdir(path.join(rootDir, dir), { withFileTypes: true })
    } catch {
      return `unverifiable:${crypto.randomUUID()}`
    }
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const relativePath = dir === "." ? entry.name : `${dir}/${entry.name}`
      if (isDeniedPath(relativePath)) continue
      if (entry.isDirectory()) {
        directories.push(relativePath)
        continue
      }
      if ((!entry.isFile() && !entry.isSymbolicLink()) || !sourceFilePattern.test(relativePath)) continue
      const safePath = await resolveAllowedFile(rootDir, relativePath)
      if (!safePath) continue
      files += 1
      if (files > maxFallbackFiles) return `unverifiable:${crypto.randomUUID()}`
      try {
        bytes += (await fs.stat(safePath)).size
        if (bytes > maxFallbackBytes) return `unverifiable:${crypto.randomUUID()}`
        const content = await fs.readFile(safePath)
        hash.update(relativePath).update("\0").update(content).update("\0")
      } catch {
        return `unverifiable:${crypto.randomUUID()}`
      }
    }
  }
  return hash.digest("hex")
}

export async function hashProjectState(rootDir: string): Promise<HashResult> {
  const hash = crypto.createHash("sha256")
  const trackedFiles: string[] = []

  for (const relativePath of HASH_RELEVANT_FILES) {
    const content = await readIfExists(rootDir, relativePath)
    if (content === undefined) continue
    trackedFiles.push(relativePath)
    hash.update(`file:${relativePath}\n`)
    hash.update(content)
    hash.update("\n")
  }

  const git = await gitState(rootDir)
  if (git === undefined) {
    trackedFiles.push("[source-state]")
    hash.update(await nonGitSourceState(rootDir))
  } else {
    trackedFiles.push("[git-state]")
    hash.update(git)
  }

  return { hash: hash.digest("hex"), trackedFiles }
}
