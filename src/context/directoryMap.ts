import fs from "node:fs/promises"
import path from "node:path"

import { isDeniedPath } from "../security.js"

export async function listDirectoryMap(rootDir: string, dir = ".", depth = 0): Promise<string[]> {
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
