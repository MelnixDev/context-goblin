import crypto from "node:crypto"
import fs from "node:fs/promises"
import path from "node:path"
import { execFile } from "node:child_process"
import { promisify } from "node:util"

import { HASH_RELEVANT_FILES } from "../constants.js"
import { isDeniedPath } from "../security.js"
import type { HashResult } from "./types.js"

const execFileAsync = promisify(execFile)
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
  try {
    return await fs.readFile(path.join(rootDir, relativePath), "utf8")
  } catch {
    return undefined
  }
}

async function gitState(rootDir: string): Promise<string> {
  try {
    const options = { cwd: rootDir, maxBuffer: 16 * 1024 * 1024 }
    const [branch, head, status] = await Promise.all([
      execFileAsync("git", ["rev-parse", "--abbrev-ref", "HEAD"], options),
      execFileAsync("git", ["rev-parse", "HEAD"], options),
      execFileAsync("git", ["status", "--porcelain=v1", "-z", "--untracked-files=all", "--", ...gitPathspec], options),
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
        const content = await fs.readFile(path.join(rootDir, relativePath))
        workingTreeHashes.push(`${relativePath}:${crypto.createHash("sha256").update(content).digest("hex")}`)
      } catch {
        workingTreeHashes.push(`${relativePath}:[unreadable]`)
      }
    }
    return [
      `branch:${branch.stdout.trim()}`,
      `head:${head.stdout.trim()}`,
      `status:${status.stdout}`,
      `working-tree:${workingTreeHashes.join("\n")}`,
    ].join("\n")
  } catch {
    return "git:[unavailable]"
  }
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
  trackedFiles.push("[git-state]")
  hash.update(git)

  return { hash: hash.digest("hex"), trackedFiles }
}
