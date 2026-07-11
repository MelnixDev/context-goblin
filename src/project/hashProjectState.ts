import crypto from "node:crypto"
import fs from "node:fs/promises"
import path from "node:path"
import { execFile } from "node:child_process"
import { promisify } from "node:util"

import { HASH_RELEVANT_FILES } from "../constants.js"
import type { HashResult } from "./types.js"

const execFileAsync = promisify(execFile)

async function readIfExists(rootDir: string, relativePath: string): Promise<string | undefined> {
  try {
    return await fs.readFile(path.join(rootDir, relativePath), "utf8")
  } catch {
    return undefined
  }
}

async function gitState(rootDir: string): Promise<string> {
  try {
    const branch = await execFileAsync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd: rootDir })
    const head = await execFileAsync("git", ["rev-parse", "HEAD"], { cwd: rootDir })
    return `branch:${branch.stdout.trim()}\nhead:${head.stdout.trim()}`
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
