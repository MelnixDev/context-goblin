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

To also enable the OpenCode menu/slash command, load the TUI plugin entrypoint too:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["context-goblin", "context-goblin/tui"]
}
```

For local development, build and add a shim:

```js
export { default, ContextGoblin } from "file:///absolute/path/to/context-goblin/dist/src/index.js"
```

For local TUI command development, add a second shim:

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
```

OpenCode menu/slash command:

```txt
Context Goblin: Show Stats
/context-goblin-stats
/cg-stats
```

The menu command is provided by the separate `context-goblin/tui` plugin entrypoint. Restart OpenCode after changing plugin config.

Cache files:

```txt
.opencode/cache/context-goblin/project-context.md
.opencode/cache/context-goblin/project-context.state.json
```

The cache includes detected stack, package scripts, a compact directory map, a ranked source/test code map, safety exclusions, and project instructions when present. The state file also records cache statistics such as byte size, line count, section list, tracked-file count, and code-map coverage.

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

Latest real `openai/gpt-5.5` token run:

| Metric | Baseline | Context Goblin | Change | Status |
| --- | ---: | ---: | ---: | --- |
| Input tokens | 12,482 | 12,188 | 2% fewer | pass |
| Total event tokens | 45,585 | 58,374 | 28% more | fail |
| Files read | 16 | 9 | 44% fewer | pass |
| Cache size | n/a | 2,580 bytes | n/a | pass |

Token result: mixed. Context Goblin reduced file reads and slightly reduced direct input tokens in this run, but total event tokens were higher because provider/OpenCode event accounting includes cache-read, reasoning, and multi-step tool-call records. This is token usage evidence, not a claim of total token-cost reduction.

Note: the committed token report predates tool-output compaction. Run `npm run check:tokens` again after installing `0.1.7+` to measure compaction effects on your OpenCode/provider event accounting.

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

Latest result using `openai/gpt-5.5`:

| Model | Baseline Reads | Goblin Reads | File Reduction | Input Token Reduction | Cache Size | Result |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| openai/gpt-5.5 | 16 | 5 | 69% | 68% | 2580 | pass |

Negative token reduction means the Context Goblin run used more input tokens than the baseline. Raw OpenCode event logs and metadata are ignored by git.

## License

MIT
