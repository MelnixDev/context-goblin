import { Buffer } from "node:buffer"

export function byteSize(input: string): number {
  return Buffer.byteLength(input, "utf8")
}

export function truncateMarkdown(markdown: string, maxCacheKb: number): string {
  const maxBytes = maxCacheKb * 1024
  if (byteSize(markdown) <= maxBytes) return markdown

  const lines = markdown.split("\n")
  const criticalHeadings = new Set([
    "# Context Goblin Project Cache",
    "## Detected Stack",
    "## Important Commands",
    "## Directory Map",
    "## Safety Exclusions",
    "## Agent Instructions",
  ])
  const kept: string[] = []
  let currentHeading = ""
  let sectionLineCount = 0

  for (const line of lines) {
    if (line.startsWith("#")) {
      currentHeading = line
      sectionLineCount = 0
    }
    sectionLineCount += 1
    if (criticalHeadings.has(currentHeading) || sectionLineCount <= 20) kept.push(line)
  }

  let output = `${kept.join("\n")}\n\n[TRUNCATED]\n`
  while (byteSize(output) > maxBytes && kept.length > 8) {
    kept.splice(Math.max(1, kept.length - 4), 1)
    output = `${kept.join("\n")}\n\n[TRUNCATED]\n`
  }

  if (byteSize(output) > maxBytes) {
    const marker = "\n\n[TRUNCATED]\n"
    output = output.slice(0, Math.max(0, maxBytes - byteSize(marker) - 4)) + marker
  }

  return output
}
