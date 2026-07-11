import fs from "node:fs/promises"
import path from "node:path"

import { isDeniedPath, redactSecrets } from "../security.js"

export async function readTextIfAllowed(rootDir: string, relativePath: string): Promise<string | undefined> {
  if (isDeniedPath(relativePath)) return undefined
  try {
    return redactSecrets(await fs.readFile(path.join(rootDir, relativePath), "utf8"))
  } catch {
    return undefined
  }
}
