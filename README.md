# Context Goblin

OpenCode plugin for AI coding agents that creates a compact, safe project-context cache and code map. Context Goblin helps OpenCode agents reduce repository rediscovery, lower file reads, and reuse project facts without caching secrets.

Useful for OpenCode plugin workflows, AI coding agents, repository context caching, token usage evidence, safe project summaries, and code-map based project understanding.

## Install

The npm `latest` release is the supported version.

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["context-goblin"]
}
```

For local development, build and add a shim:

```js
export { default, ContextGoblin } from "file:///absolute/path/to/context-goblin/dist/src/index.js"
```

Optional local TUI experiment shim:

```js
export { tui } from "file:///absolute/path/to/context-goblin/dist/src/tui.js"
```

Shim locations:

```txt
.opencode/plugins/context-goblin.js
~/.config/opencode/plugins/context-goblin.js
```

## Tools

```txt
context_goblin_status
context_goblin_refresh
context_goblin_read
context_goblin_stats
context_goblin_usage_stats
```

OpenCode slash commands:

```txt
/context-goblin-stats
/context-goblin-usage
```

The slash commands are registered by the server plugin through OpenCode's native command config. `/context-goblin-stats` expands to a prompt that calls `context_goblin_status`, then `context_goblin_stats`, and reports cache freshness, size, tracked files, and code-map coverage. `/context-goblin-usage` calls `context_goblin_usage_stats` and summarizes local token usage rollups. Restart OpenCode after changing plugin config.

Cache files:

```txt
.opencode/cache/context-goblin/project-context.md
.opencode/cache/context-goblin/project-context.state.json
.opencode/cache/context-goblin/usage-state.json
```

The cache includes detected stack, package scripts, a compact directory map, a ranked source/test code map, safety exclusions, and project instructions when present. The state file also records cache statistics such as byte size, line count, section list, tracked-file count, and code-map coverage.

The usage state stores local numeric OpenCode token rollups only: step count, hashed session IDs for unique session counts, input/output/reasoning/cache/total tokens, and reported cost when available. It does not store prompts, responses, tool outputs, or file contents.

## Usage

After adding the plugin config:

```txt
1. Restart OpenCode.
2. Type /context-goblin-stats.
3. Type /context-goblin-usage to inspect local token usage rollups.
4. If the cache is missing or stale, ask the agent to run context_goblin_refresh.
5. Ask the agent to use Context Goblin before broad repo discovery.
```

Recommended prompt:

```txt
Use Context Goblin before broad repository discovery. Check status, refresh if missing or stale, read the cache, show a short stats summary, then inspect only task-specific files that are still needed.
```

If the slash command does not appear:

```txt
1. Confirm config includes "context-goblin".
2. Confirm npm latest is 0.1.14 or newer.
3. Fully restart OpenCode after changing config.
4. Check project config is not overriding global plugin config.
```

## Tool Output Compaction

Context Goblin also reduces wasted LLM context from oversized tool outputs. By default, it compacts only large `bash`, `grep`, and `glob` outputs over 12,000 characters. It keeps the beginning and end, records the omitted size in metadata, and tells the agent to rerun a focused command if exact omitted output is required.

It does not compact exact file reads by default, because code content is often needed for correctness.

Configuration:

```json
{
  "plugin": [["context-goblin", {
    "compactToolOutputs": true,
    "compactToolOutputThresholdChars": 12000,
    "compactToolOutputKeepStartChars": 4000,
    "compactToolOutputKeepEndChars": 2000,
    "compactToolOutputTools": ["bash", "grep", "glob"]
  }]]
}
```

## Local Usage Stats

Context Goblin records approximate token usage from OpenCode `step_finish` events while the plugin is enabled for a workspace. This is useful for seeing local trends such as today's usage, last 7 days, and last 30 days.

```txt
context_goblin_usage_stats
/context-goblin-usage
```

Tracked numeric fields:

```txt
input tokens
output tokens
reasoning tokens
cache read tokens
cache write tokens
total event tokens
reported cost
step count
unique session count
```

Important caveat: these are OpenCode event token statistics, not a guaranteed provider billing invoice. Providers may omit fields, report `cost: 0`, or account for cached/reasoning tokens differently.

## Recommended Agent Flow

Before broad repository discovery, ask the agent to use Context Goblin in this order:

```txt
1. context_goblin_status
2. if missing or stale: context_goblin_refresh
3. context_goblin_read
4. context_goblin_stats
5. briefly summarize cache freshness, size, tracked files, and code-map coverage
6. inspect only task-specific files whose implementation details are still missing
```

Reusable agent instruction:

```txt
Before broad repository discovery, use Context Goblin. Call context_goblin_status, refresh if missing or stale, read the cache, then call context_goblin_stats and briefly mention cache freshness, size, tracked files, and code-map coverage. Use the cache to avoid broad scans and read only task-specific files that are still needed.
```

## Safety

Context Goblin must not cache secrets, dependency folders, generated output, or cache internals.

Default exclusions include:

```txt
.env
.env.*
*.pem
*.key
secrets.json
credentials.json
node_modules/**
.git/**
dist/**
build/**
coverage/**
.opencode/cache/context-goblin/**
```

## Checks

```bash
npm run typecheck
npm run test
npm run build
npm run check:reports
npm run smoke:opencode
npm run check:models:general
npm run check:tokens
```

## Token Usage Evidence

Run the focused token benchmark:

```bash
MODEL_GROUP=standard npm run check:tokens
```

Report:

```txt
examples/token-usage-ab-report.md
```

Latest real `openai/gpt-5.5` token run on OpenCode `1.17.18` with Context Goblin `0.1.14`:

| Metric | Baseline | Context Goblin | Change | Status |
| --- | ---: | ---: | ---: | --- |
| Input tokens | 9,202 | 8,131 | 12% fewer | pass |
| Total event tokens | 51,391 | 56,252 | 9% more | fail |
| Files read | 15 | 7 | 53% fewer | pass |
| Cache size | n/a | 2,580 bytes | n/a | pass |

Token result: mixed. Context Goblin reduced file reads and direct input tokens in this run, but total event tokens were higher because provider/OpenCode event accounting includes cache-read, reasoning, and multi-step tool-call records. This is token usage evidence, not a claim of total token-cost reduction.

## Latest A/B Result

Run the current general model A/B benchmark:

```bash
MODEL_GROUP=standard npm run check:models:general
```

Optional model groups:

```bash
MODEL_GROUP=free npm run check:models:general
MODEL_GROUP=all npm run check:models:general
```

Report:

```txt
examples/model-general-ab-report.md
```

The benchmark compares a normal OpenCode run against a Context Goblin run on the same synthetic React/Vite cart/catalog app. The baseline is not forced to read a fixed file list; the Context Goblin run must call `context_goblin_status`, `context_goblin_refresh`, and `context_goblin_read` before inspecting only missing implementation details.

Latest result using `openai/gpt-5.5` on OpenCode `1.17.18` with Context Goblin `0.1.14`:

| Model | Baseline Reads | Goblin Reads | File Reduction | Input Token Reduction | Cache Size | Result |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| openai/gpt-5.5 | 16 | 7 | 56% | 14% | 2580 | pass |

Negative token reduction means the Context Goblin run used more input tokens than the baseline. Raw OpenCode event logs and metadata are ignored by git.

## License

MIT
