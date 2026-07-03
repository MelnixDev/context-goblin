import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"

export async function tempProject(): Promise<string> {
  return await fs.mkdtemp(path.join(os.tmpdir(), "context-goblin-"))
}

export async function writeFile(rootDir: string, relativePath: string, content: string): Promise<void> {
  const filePath = path.join(rootDir, relativePath)
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, content)
}

export async function readFile(rootDir: string, relativePath: string): Promise<string> {
  return await fs.readFile(path.join(rootDir, relativePath), "utf8")
}

export async function copyFixture(name: string): Promise<string> {
  const root = await tempProject()
  const source = path.join(process.cwd(), "tests", "fixtures", name)
  await fs.cp(source, root, { recursive: true })
  return root
}
