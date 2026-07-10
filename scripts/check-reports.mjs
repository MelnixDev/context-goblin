import fs from "node:fs"
import path from "node:path"

const repoRoot = process.cwd()
const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"))
const examplesDir = path.join(repoRoot, "examples")
const failures = []

function fail(message) {
  failures.push(message)
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8")
}

function markdownFiles(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
    .map((name) => path.join(dir, name))
}

for (const filePath of markdownFiles(examplesDir)) {
  const relativePath = path.relative(repoRoot, filePath)
  const text = fs.readFileSync(filePath, "utf8")
  const forbidden = [
    /super-secret/i,
    /\bwrk_[A-Z0-9]+\b/i,
    /\b(?:API_KEY|PASSWORD|PRIVATE_KEY|TOKEN)=/,
  ]
  for (const pattern of forbidden) {
    if (pattern.test(text)) fail(`${relativePath} contains forbidden pattern ${pattern}`)
  }
}

for (const reportPath of ["examples/model-general-ab-report.md", "examples/token-usage-ab-report.md"]) {
if (fs.existsSync(path.join(repoRoot, reportPath))) {
  const text = read(reportPath)
  const versionMatch = text.match(/^Context Goblin version: (.+)$/m)
  if (!versionMatch) fail(`${reportPath} is missing Context Goblin version`)
  else if (versionMatch[1] !== packageJson.version) {
    fail(`${reportPath} version ${versionMatch[1]} does not match package.json ${packageJson.version}`)
  }

  const summaryMatch = text.match(/## Summary\n\n([\s\S]*?)\n\n## /)
  if (!summaryMatch) fail(`${reportPath} is missing a summary table`)
  else {
    if (reportPath.includes("token-usage") && !summaryMatch[1].includes("Baseline Input")) {
      fail(`${reportPath} is missing token usage columns`)
    }
    const rows = summaryMatch[1].split("\n").filter((line) => line.startsWith("| ") && !line.includes("---"))
    for (const row of rows.slice(1)) {
      const cells = row.split("|").map((cell) => cell.trim()).filter(Boolean)
      const result = cells.at(-1)
      if (!result || !["pass", "fail", "error"].includes(result)) {
        fail(`${reportPath} has invalid result '${result || ""}' in row: ${row}`)
      }
      if (cells[1] === "no" && result === "fail") {
        fail(`${reportPath} reports failed baseline as fail instead of error: ${row}`)
      }
    }
  }
}
}

if (failures.length > 0) {
  console.error(failures.map((message) => `- ${message}`).join("\n"))
  process.exit(1)
}

console.log("Report checks passed")
