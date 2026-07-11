import fs from "node:fs/promises"
import path from "node:path"

import { CACHE_MARKDOWN, CACHE_STATE } from "../constants.js"
import { hashProjectState } from "../project/hashProjectState.js"
import type { CacheStatus, ProjectState } from "./types.js"

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

export async function cacheStatus(rootDir: string): Promise<CacheStatus> {
  const cachePath = path.join(rootDir, CACHE_MARKDOWN)
  const statePath = path.join(rootDir, CACHE_STATE)
  const projectHash = await hashProjectState(rootDir)
  const cacheExists = await exists(cachePath)
  const stateExists = await exists(statePath)

  if (!cacheExists && !stateExists) {
    return { exists: false, stale: true, reason: "missing cache", cachePath, statePath, projectHash: projectHash.hash }
  }
  if (!cacheExists) {
    return { exists: false, stale: true, reason: "cache markdown missing", cachePath, statePath, projectHash: projectHash.hash }
  }
  if (!stateExists) {
    return { exists: true, stale: true, reason: "state JSON missing", cachePath, statePath, projectHash: projectHash.hash }
  }

  try {
    const state = JSON.parse(await fs.readFile(statePath, "utf8")) as ProjectState
    const stale = state.projectHash !== projectHash.hash
    return {
      exists: true,
      stale,
      reason: stale ? "project hash changed" : "fresh",
      cachePath,
      statePath,
      projectHash: projectHash.hash,
      state,
    }
  } catch {
    return { exists: true, stale: true, reason: "state JSON invalid", cachePath, statePath, projectHash: projectHash.hash }
  }
}
