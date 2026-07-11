export interface DetectedStack {
  packageManager: string | "[NEEDS INPUT]"
  languages: string[]
  frameworks: string[]
  scripts: Record<string, string>
  entryPoints: string[]
  notes: string[]
}

export interface HashResult {
  hash: string
  trackedFiles: string[]
}
