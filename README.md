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

Cache files:

```txt
.opencode/cache/context-goblin/project-context.md
.opencode/cache/context-goblin/project-context.state.json
```

The cache includes detected stack, package scripts, a compact directory map, a ranked source/test code map, safety exclusions, and project instructions when present. The state file also records cache statistics such as byte size, line count, section list, tracked-file count, and code-map coverage.

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
