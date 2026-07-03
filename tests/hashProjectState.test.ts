import { execFile } from "node:child_process"
import { promisify } from "node:util"

import { describe, expect, it } from "vitest"

import { hashProjectState } from "../src/hashProjectState.js"
import { tempProject, writeFile } from "./helpers.js"

const execFileAsync = promisify(execFile)

describe("hashProjectState", () => {
    it("is deterministic for the same relevant files", async () => {
        const root = await tempProject()
        await writeFile(root, "package.json", JSON.stringify({ name: "x" }))
        expect((await hashProjectState(root)).hash).toBe((await hashProjectState(root)).hash)
    })

    it.each(["package.json", "AGENTS.md", "opencode.json", "tsconfig.json"])(
        "changes when %s changes",
        async (file) => {
            const root = await tempProject()
            await writeFile(root, file, "one")
            const before = await hashProjectState(root)
            await writeFile(root, file, "two")
            const after = await hashProjectState(root)
            expect(after.hash, file).not.toBe(before.hash)
        },
        10_000,
    )

    it("changes when git branch changes", async () => {
        const root = await tempProject()
        await execFileAsync("git", ["init"], { cwd: root })
        await execFileAsync("git", ["config", "user.email", "test@example.com"], { cwd: root })
        await execFileAsync("git", ["config", "user.name", "Test"], { cwd: root })
        await writeFile(root, "package.json", JSON.stringify({ name: "x" }))
        await execFileAsync("git", ["add", "package.json"], { cwd: root })
        await execFileAsync("git", ["commit", "-m", "initial"], { cwd: root })
        const before = await hashProjectState(root)
        await execFileAsync("git", ["checkout", "-b", "feature"], { cwd: root })
        const after = await hashProjectState(root)
        expect(after.hash).not.toBe(before.hash)
    })

    it("ignores non-relevant and node_modules file changes", async () => {
        const root = await tempProject()
        await writeFile(root, "package.json", JSON.stringify({ name: "x" }))
        const before = await hashProjectState(root)
        await writeFile(root, "src/index.ts", "changed")
        await writeFile(root, "node_modules/pkg/index.js", "changed")
        const after = await hashProjectState(root)
        expect(after.hash).toBe(before.hash)
    })
})