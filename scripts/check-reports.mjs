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

function parseVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version)
  return match ? match.slice(1).map(Number) : undefined
}

function isCurrentOrPreviousPatch(reportVersion, packageVersion) {
  const report = parseVersion(reportVersion)
  const current = parseVersion(packageVersion)
  if (!report || !current) return false
  return report[0] === current[0] && report[1] === current[1] && current[2] - report[2] >= 0 && current[2] - report[2] <= 1
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

for (const reportPath of ["examples/model-general-ab-report.md", "examples/token-usage-ab-report.md", "examples/model-stability-ab-report.md"]) {
if (fs.existsSync(path.join(repoRoot, reportPath))) {
  const text = read(reportPath)
  const versionMatch = text.match(/^Context Goblin version: (.+)$/m)
  if (!versionMatch) fail(`${reportPath} is missing Context Goblin version`)
  else if (!isCurrentOrPreviousPatch(versionMatch[1], packageJson.version)) {
    fail(`${reportPath} version ${versionMatch[1]} must match package.json ${packageJson.version} or its immediately previous patch`)
  }

  const stabilityDeferred = reportPath.includes("stability") && /Deferred — the repeated agentic run is not a valid performance result yet/i.test(text)
  const summaryMatch = text.match(/## Summary\n\n([\s\S]*?)\n\n## /)
  if (!summaryMatch && !stabilityDeferred) fail(`${reportPath} is missing a summary table`)
  if (summaryMatch) {
    if (reportPath.includes("token-usage") && !summaryMatch[1].includes("Baseline Input")) {
      fail(`${reportPath} is missing token usage columns`)
    }
    const rows = summaryMatch[1].split("\n").filter((line) => line.startsWith("| ") && !line.includes("---"))
    for (const row of rows.slice(1)) {
      const cells = row.split("|").map((cell) => cell.trim()).filter(Boolean)
      const result = cells.at(-1)
      const allowedResults = ["pass", "mixed", "fail", "error"]
      if (!result || !allowedResults.includes(result)) {
        fail(`${reportPath} has invalid result '${result || ""}' in row: ${row}`)
      }
      if (reportPath.includes("token-usage")) {
        const inputStatus = cells[4]
        const totalStatus = cells[8]
        const fileStatus = cells[12]
        if (result === "pass" && [inputStatus, totalStatus, fileStatus].some((status) => status !== "pass")) {
          fail(`${reportPath} reports token pass without all efficiency metrics passing: ${row}`)
        }
      }
      if (reportPath.includes("model-general")) {
        const reductions = cells.slice(6, 9)
        const compatibility = cells[12]
        if (result === "pass" && (compatibility !== "pass" || reductions.some((value) => !/^\d+%$/.test(value) || value === "0%"))) {
          fail(`${reportPath} reports overall pass without positive compatibility and efficiency results: ${row}`)
        }
      }
      if (cells[1] === "no" && result === "fail") {
        fail(`${reportPath} reports failed baseline as fail instead of error: ${row}`)
      }
    }
  }

  if (reportPath.includes("stability")) {
    const deferred = /Deferred — the repeated agentic run is not a valid performance result yet/i.test(text)
    const hasValidEvidence = /Valid evidence already available/i.test(text)
    const hasReproduction = /npm run benchmark:stable/i.test(text)
    if (!deferred || !hasValidEvidence || !hasReproduction) {
      fail(`${reportPath} must explicitly distinguish deferred stability runs from valid evidence`)
    }
  }
}
}

if (failures.length > 0) {
  console.error(failures.map((message) => `- ${message}`).join("\n"))
  process.exit(1)
}

console.log("Report checks passed")
