import path from "node:path"

import { CACHE_DIR } from "./constants.js"

const deniedExact = new Set([".env", "private.key", "secrets.json", "credentials.json"])
const deniedDirs = new Set([
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".git",
  ".next",
  ".nuxt",
  ".output",
])

export function normalizeRelativePath(filePath: string): string {
  return filePath.split(path.sep).join("/").replace(/^\.\//, "")
}

export function isDeniedPath(filePath: string): boolean {
  const normalized = normalizeRelativePath(filePath)
  const basename = path.posix.basename(normalized)
  const segments = normalized.split("/")

  if (deniedExact.has(normalized) || deniedExact.has(basename)) return true
  if (basename.startsWith(".env")) return true
  if (basename.endsWith(".key") || basename.endsWith(".pem")) return true
  if (segments.some((segment) => deniedDirs.has(segment))) return true
  if (normalized === CACHE_DIR || normalized.startsWith(`${CACHE_DIR}/`)) return true

  return false
}

export function redactSecrets(input: string): string {
  return input.replace(
    /^([\w.-]*(?:API_KEY|TOKEN|SECRET|PASSWORD|PRIVATE_KEY)[\w.-]*\s*=\s*)(.+)$/gim,
    "$1[REDACTED]",
  )
}
