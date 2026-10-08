import fs from "node:fs/promises"
import path from "node:path"

import { isDeniedPath, redactSecrets } from "../security.js"

export async function resolveAllowedFile(rootDir: string, relativePath: string): Promise<string | undefined> {
  if (isDeniedPath(relativePath)) return undefined
  try {
    const root = await fs.realpath(rootDir)
    const target = await fs.realpath(path.join(root, relativePath))
    const canonicalRelative = path.relative(root, target)
    if (!canonicalRelative || canonicalRelative.startsWith(`..${path.sep}`) || canonicalRelative === ".." || path.isAbsolute(canonicalRelative) || isDeniedPath(canonicalRelative)) return undefined
    if (!(await fs.stat(target)).isFile()) return undefined
    return target
  } catch {
    return undefined
  }
}

export async function readTextIfAllowed(rootDir: string, relativePath: string): Promise<string | undefined> {
  const target = await resolveAllowedFile(rootDir, relativePath)
  if (!target) return undefined
  try {
    return redactSecrets(await fs.readFile(target, "utf8"))
  } catch {
    return undefined
  }
}
