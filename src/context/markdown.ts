import { CACHE_VERSION, SAFETY_EXCLUSIONS } from "../constants.js"
import type { DetectedStack } from "../project/types.js"
import type { CodeMap } from "./codeMap.js"

const sections = ["Detected Stack", "Important Commands", "Directory Map", "Code Map", "Safety Exclusions", "Agent Instructions"]

export function contextSections(): string[] {
  return sections
}

function formatScripts(scripts: Record<string, string>): string {
  const names = Object.keys(scripts)
  if (names.length === 0) return "- [NEEDS INPUT] No package scripts detected."
  return names.map((name) => `- ${name}`).join("\n")
}

export function renderProjectContextMarkdown(input: {
  generatedAt: string
  stack: DetectedStack
  directoryMap: string[]
  codeMap: CodeMap
  agentsPresent: boolean
}): string {
  return `# Context Goblin Project Cache

Generated: ${input.generatedAt}
Version: ${CACHE_VERSION}

## Detected Stack

- Package manager: ${input.stack.packageManager}
- Languages: ${input.stack.languages.length ? input.stack.languages.join(", ") : "[NEEDS INPUT]"}
- Frameworks: ${input.stack.frameworks.length ? input.stack.frameworks.join(", ") : "[NEEDS INPUT]"}
- Entry points: ${input.stack.entryPoints.length ? input.stack.entryPoints.join(", ") : "[NEEDS INPUT]"}
- Notes: ${input.stack.notes.length ? input.stack.notes.join("; ") : "none"}

## Important Commands

${formatScripts(input.stack.scripts)}

## Directory Map

${input.directoryMap.length ? input.directoryMap.join("\n") : "- [NEEDS INPUT] No readable project files detected."}

## Code Map

${input.codeMap.entries.length ? input.codeMap.entries.join("\n") : "- [NEEDS INPUT] No source/test code facts detected."}

## Safety Exclusions

${SAFETY_EXCLUSIONS.map((item) => `- ${item}`).join("\n")}

Denied paths are summarized only. Their contents are not read into this cache.

## Agent Instructions

Before scanning broad repository files:

1. Read this cache.
2. Inspect only the smallest file set needed for the task.
3. Never read denied paths or secret-looking files.

${input.agentsPresent ? "AGENTS.md exists. Read it directly for the current instructions; its contents are not copied into this cache." : "No AGENTS.md found."}
`
}
