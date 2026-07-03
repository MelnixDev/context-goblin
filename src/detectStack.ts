import fs from "node:fs/promises"
import path from "node:path"

import type { DetectedStack } from "./types.js"

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function readJson(filePath: string): Promise<Record<string, unknown>> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as Record<string, unknown>
  } catch {
    return {}
  }
}

export async function detectStack(rootDir: string): Promise<DetectedStack> {
  const packageJsonPath = path.join(rootDir, "package.json")
  const packageJson = await readJson(packageJsonPath)
  const dependencies = {
    ...((packageJson.dependencies as Record<string, string> | undefined) ?? {}),
    ...((packageJson.devDependencies as Record<string, string> | undefined) ?? {}),
  }
  const scripts = (packageJson.scripts as Record<string, string> | undefined) ?? {}
  const frameworks: string[] = []
  const languages: string[] = []
  const entryPoints: string[] = []
  const notes: string[] = []

  let packageManager: DetectedStack["packageManager"] = "[NEEDS INPUT]"
  if (await exists(path.join(rootDir, "pnpm-lock.yaml"))) packageManager = "pnpm"
  else if (await exists(path.join(rootDir, "package-lock.json"))) packageManager = "npm"
  else if (await exists(path.join(rootDir, "yarn.lock"))) packageManager = "yarn"
  else if (await exists(path.join(rootDir, "bun.lockb"))) packageManager = "bun"

  if (await exists(path.join(rootDir, "tsconfig.json"))) languages.push("TypeScript")
  if (await exists(path.join(rootDir, "jsconfig.json")) || languages.length === 0) languages.push("JavaScript")

  if (dependencies.next || (await exists(path.join(rootDir, "next.config.js"))) || (await exists(path.join(rootDir, "next.config.mjs")))) frameworks.push("Next.js")
  if (dependencies.react) frameworks.push("React")
  if (dependencies.vite || (await exists(path.join(rootDir, "vite.config.ts"))) || (await exists(path.join(rootDir, "vite.config.js")))) frameworks.push("Vite")
  if (dependencies.express) frameworks.push("Express")
  if (Object.keys(packageJson).length > 0 && !frameworks.includes("Node.js")) frameworks.push("Node.js")

  for (const candidate of ["src/index.ts", "src/index.js", "src/main.tsx", "src/main.ts", "app/page.tsx", "pages/index.tsx"]) {
    if (await exists(path.join(rootDir, candidate))) entryPoints.push(candidate)
  }
  if (await exists(path.join(rootDir, "app"))) notes.push("Uses app directory")
  if (Object.keys(scripts).length === 0) notes.push("scripts: [NEEDS INPUT]")

  return { packageManager, languages, frameworks, scripts, entryPoints, notes }
}
