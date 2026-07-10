import fs from "node:fs/promises"
import path from "node:path"

import { describe, expect, it } from "vitest"

import { CACHE_MARKDOWN, CACHE_STATE } from "../src/constants.js"
import { generateProjectContext } from "../src/generateProjectContext.js"
import { byteSize } from "../src/truncateMarkdown.js"
import { tempProject, writeFile, readFile } from "./helpers.js"

describe("generateProjectContext", () => {
  it("creates safe markdown cache and state JSON", async () => {
    const root = await tempProject()
    await writeFile(root, "package.json", JSON.stringify({ scripts: { test: "vitest" }, dependencies: { react: "latest" } }))
    await writeFile(root, "tsconfig.json", "{}")
    await writeFile(root, "src/index.ts", "export const value = 1")
    await writeFile(root, ".env", "API_KEY=super-secret-value")
    await writeFile(root, "private.key", "PRIVATE_KEY=super-secret-private-key")

    await generateProjectContext({ rootDir: root, maxCacheKb: 8 })

    const markdown = await readFile(root, CACHE_MARKDOWN)
    const state = JSON.parse(await readFile(root, CACHE_STATE)) as Record<string, unknown>

    await expect(fs.access(path.join(root, CACHE_MARKDOWN))).resolves.toBeUndefined()
    await expect(fs.access(path.join(root, CACHE_STATE))).resolves.toBeUndefined()
    for (const heading of [
      "# Context Goblin Project Cache",
      "## Detected Stack",
      "## Important Commands",
      "## Directory Map",
      "## Code Map",
      "## Safety Exclusions",
      "## Agent Instructions",
    ]) {
      expect(markdown).toContain(heading)
    }
    expect(markdown).not.toContain("super-secret-value")
    expect(markdown).not.toContain("super-secret-private-key")
    expect(byteSize(markdown)).toBeLessThanOrEqual(8 * 1024)
    expect(state.version).toBeTypeOf("string")
    expect(state.generatedAt).toBeTypeOf("string")
    expect(state.projectHash).toBeTypeOf("string")
    expect(state.trackedFiles).toBeInstanceOf(Array)
    expect(state.stats).toMatchObject({
      cacheBytes: expect.any(Number),
      cacheLines: expect.any(Number),
      directoryEntries: expect.any(Number),
      codeMapFiles: expect.any(Number),
      codeMapEntries: expect.any(Number),
      sections: expect.arrayContaining(["Detected Stack", "Code Map"]),
    })
  })

  it("includes compact source and test code facts", async () => {
    const root = await tempProject()
    await writeFile(root, "package.json", JSON.stringify({ scripts: { test: "vitest" }, dependencies: { react: "latest" } }))
    await writeFile(root, "src/features/cart/cartStore.ts", [
      "export interface CartItem { id: string }",
      "export function addToCart(item: CartItem) { return item }",
      "export function removeFromCart(id: string) { return id }",
      "export function getCartItems() { return [] as CartItem[] }",
    ].join("\n"))
    await writeFile(root, "src/features/cart/CartDrawer.tsx", [
      "import { getCartItems, removeFromCart } from './cartStore'",
      "export function CartDrawer() { return <aside>{getCartItems().map((item) => <button onClick={() => removeFromCart(item.id)} />)}</aside> }",
    ].join("\n"))
    await writeFile(root, "tests/cartStore.test.ts", [
      "import { describe, it } from 'vitest'",
      "describe('cartStore', () => { it('adds and removes items', () => {}) })",
    ].join("\n"))

    await generateProjectContext({ rootDir: root, maxCacheKb: 12 })

    const markdown = await readFile(root, CACHE_MARKDOWN)
    expect(markdown).toContain("## Code Map")
    expect(markdown).toContain("src/features/cart/cartStore.ts")
    expect(markdown).toContain("addToCart")
    expect(markdown).toContain("removeFromCart")
    expect(markdown).toContain("getCartItems")
    expect(markdown).toContain("src/features/cart/CartDrawer.tsx")
    expect(markdown).toContain("CartDrawer")
    expect(markdown).toContain("tests/cartStore.test.ts")
    expect(markdown).toContain("adds and removes items")
  })

  it("prioritizes entry points and feature code in the code map", async () => {
    const root = await tempProject()
    await writeFile(root, "package.json", JSON.stringify({ scripts: { test: "vitest" } }))
    await writeFile(root, "src/main.tsx", "export function bootstrap() { return null }")
    await writeFile(root, "src/features/cart/cartStore.ts", "export function addToCart() { return true }")
    await writeFile(root, "aaa/lowPriority.ts", "export function lowPriority() { return true }")

    await generateProjectContext({ rootDir: root, maxCacheKb: 12 })

    const markdown = await readFile(root, CACHE_MARKDOWN)
    expect(markdown.indexOf("src/main.tsx")).toBeLessThan(markdown.indexOf("aaa/lowPriority.ts"))
    expect(markdown.indexOf("src/features/cart/cartStore.ts")).toBeLessThan(markdown.indexOf("aaa/lowPriority.ts"))
  })
})
