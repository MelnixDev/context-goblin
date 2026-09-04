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
export { default } from "file:///absolute/path/to/context-goblin/dist/src/index.js"
```

Optional local TUI experiment shim:

```js
export { default } from "file:///absolute/path/to/context-goblin/dist/src/tui.js"
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
2. Confirm npm latest is 0.1.19 or newer.
3. Fully restart OpenCode after changing config.
4. Check project config is not overriding global plugin config.
```

## Tool Output Compaction

Context Goblin can also reduce wasted LLM context from oversized tool outputs. This behavior is opt-in so the plugin does not change OpenCode's native tool results unless explicitly requested. When enabled, it compacts only large `bash`, `grep`, and `glob` outputs over 12,000 characters. It keeps the beginning and end, records the omitted size in metadata, and tells the agent to rerun a focused command if exact omitted output is required.

It does not compact exact file reads by default, because code content is often needed for correctness.

Enable output compaction explicitly with `compactToolOutputs: true`. Existing configurations that already set it to `true` keep the same behavior.

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

Context Goblin records approximate token usage from OpenCode `step-finish` message parts while the plugin is enabled for a workspace. This is useful for seeing local trends such as today's usage, last 7 days, and last 30 days.

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
npm run smoke:opencode:live
npm run benchmark:stable
npm run check:models:general
npm run check:tokens
```

`smoke:opencode:live` runs a real headless OpenCode model session and requires configured provider credentials. Override its defaults with `OPENCODE_MODEL` or `OPENCODE_BIN`.

## Token Usage Evidence

Run the current coding-model token comparison:

```bash
OPENCODE_MODELS="openai/gpt-5.5 openai/gpt-5.6-sol" npm run check:tokens
```

Report:

```txt
examples/token-usage-ab-report.md
```

Latest real comparison on OpenCode `1.18.20` with Context Goblin `0.1.19`:

| Model | Baseline Input | Goblin Input | Input Saved | Baseline Total | Goblin Total | Total Saved | Baseline Reads | Goblin Reads | File Saved | Quality | Result |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| openai/gpt-5.5 | 10,290 | 15,661 | -52% | 37,406 | 35,282 | 6% | 15 | 8 | 47% | 6/6 | mixed |
| openai/gpt-5.6-sol | 16,143 | 16,142 | 0% | 33,956 | 39,715 | -17% | 17 | 13 | 24% | 6/6 | mixed |

In this token-focused run, Context Goblin reduced direct file reads for both models while preserving quality `6/6` and avoiding secret leakage. Token accounting was mixed: `gpt-5.5` used 52% more input tokens but 6% fewer total event tokens, while `gpt-5.6-sol` had effectively unchanged input tokens and 17% more total event tokens.

Total event tokens include provider/OpenCode cache-read, reasoning, output, and multi-step records. This is token usage evidence, not a guaranteed billing or total token-cost reduction claim.

## Latest A/B Result

Run the same coding-model comparison for the general A/B benchmark:

```bash
OPENCODE_MODELS="openai/gpt-5.5 openai/gpt-5.6-sol" npm run check:models:general
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

The benchmark compares a normal OpenCode run against a Context Goblin run on the same synthetic React/Vite cart/catalog app. Each arm receives a fresh fixture. The `task`, `bash`, and `edit` tools are denied so repository reads remain visible and comparable in the parent event stream. Both arms may use direct `read`, `glob`, and `grep`; the Context Goblin arm must call `context_goblin_status`, `context_goblin_refresh`, and `context_goblin_read` before inspecting missing implementation details.

Latest results on OpenCode `1.18.20` with Context Goblin `0.1.19`:

| Model | Baseline Reads | Goblin Reads | File Reduction | Input Token Reduction | Total Token Reduction | Quality | Cache Size | Result |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| openai/gpt-5.5 | 16 | 7 | 56% | 8% | 26% | 6/6 | 2,598 bytes | pass |
| openai/gpt-5.6-sol | 17 | 14 | 18% | 34% | -11% | 6/6 | 2,598 bytes | pass |

In the general run, both models completed successfully with quality `6/6` and no detected secret leakage. `gpt-5.5` reduced file reads by 56%, input tokens by 8%, and total event tokens by 26%. `gpt-5.6-sol` reduced file reads by 18% and input tokens by 34%, while total event tokens increased by 11%.

These are single runs per model and arm, so model behavior and provider accounting can vary. Negative reduction means the Context Goblin arm used more than the baseline. Raw OpenCode event logs and metadata are ignored by git; the generated Markdown reports are committed.

## Repeated Stability Evidence

The repeated runner is available as `npm run benchmark:stable`. It uses fresh fixture
copies, alternating execution order, one cold-cache refresh control, and warm-cache
rounds. It fails closed rather than turning provider/session timeouts into metrics.

The current report is [examples/model-stability-ab-report.md](./examples/model-stability-ab-report.md).
The short live smoke and one-shot A/B evidence are valid and documented above; the
longer repeated agentic protocol is currently deferred because OpenCode stalled before
its first event on both tested models. Therefore no repeatable multi-run savings claim
is made yet.

## License

MIT
