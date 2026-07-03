import { describe, expect, it } from "vitest"

import { isDeniedPath, redactSecrets } from "../src/security.js"

describe("security", () => {
  it("denies unsafe paths and allows safe metadata paths", () => {
    for (const denied of [
      ".env",
      ".env.local",
      "private.key",
      "secrets.json",
      "credentials.json",
      "node_modules/pkg/index.js",
      "dist/app.js",
      "build/app.js",
      ".git/config",
      ".opencode/cache/context-goblin/project-context.md",
    ]) {
      expect(isDeniedPath(denied), denied).toBe(true)
    }

    for (const allowed of ["package.json", "tsconfig.json", "README.md"]) {
      expect(isDeniedPath(allowed), allowed).toBe(false)
    }
  })

  it("redacts secret-looking assignments", () => {
    const redacted = redactSecrets([
      "API_KEY=abc123",
      "TOKEN=abc123",
      "SECRET=abc123",
      "PASSWORD=abc123",
      "PRIVATE_KEY=abc123",
    ].join("\n"))

    expect(redacted).not.toContain("abc123")
    expect(redacted).toContain("API_KEY=[REDACTED]")
  })

  it("does not modify harmless README text", () => {
    const text = "# Project\n\nThis README contains no credentials."
    expect(redactSecrets(text)).toBe(text)
  })
})
