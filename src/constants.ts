export const CACHE_VERSION = "0.1.0"

export const CACHE_DIR = ".opencode/cache/context-goblin"
export const CACHE_MARKDOWN = `${CACHE_DIR}/project-context.md`
export const CACHE_STATE = `${CACHE_DIR}/project-context.state.json`

export const DEFAULT_MAX_CACHE_KB = 25

export const HASH_RELEVANT_FILES = [
  "package.json",
  "pnpm-lock.yaml",
  "package-lock.json",
  "yarn.lock",
  "bun.lockb",
  "tsconfig.json",
  "jsconfig.json",
  "vite.config.ts",
  "vite.config.js",
  "next.config.js",
  "next.config.mjs",
  "opencode.json",
  "opencode.jsonc",
  "AGENTS.md",
  "README.md",
]

export const SAFETY_EXCLUSIONS = [
  ".env",
  ".env.*",
  "*.pem",
  "*.key",
  "secrets.json",
  "credentials.json",
  "node_modules/**",
  ".git/**",
  "dist/**",
  "build/**",
  "coverage/**",
  ".next/**",
  ".nuxt/**",
  ".output/**",
  `${CACHE_DIR}/**`,
]
