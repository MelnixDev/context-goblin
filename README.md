# Context Goblin

An OpenCode plugin that hoards tiny project-context notes so agents read less and waste fewer tokens.

> Feed your agent crumbs, not the whole repo.

## What it does

Context Goblin creates and maintains a compact project context cache for OpenCode agents.

Instead of repeatedly scanning the whole repository, the agent can start from:

```txt
.opencode/cache/context-goblin/project-context.md
```

The cache is designed to summarize:

* detected stack
* package manager
* important commands
* directory structure
* entry points
* relevant config files
* git state
* safety exclusions
* agent instructions

## What it does not do

Context Goblin does not directly control model-provider prompt caching.

Provider-side prompt caching is handled by the model provider. This plugin focuses on practical repository-context discipline: read the project cache first, then inspect only the files required for the current task.

## Planned OpenCode usage

After installation, users will be able to add the plugin to `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["context-goblin"]
}
```

For local development, build the package and add a project or global OpenCode plugin shim:

```js
export { default, ContextGoblin } from "file:///absolute/path/to/context-goblin/dist/src/index.js"
```

Project-level shim path:

```txt
.opencode/plugins/context-goblin.js
```

Global shim path:

```txt
~/.config/opencode/plugins/context-goblin.js
```

## Tools

Context Goblin exposes these OpenCode tools:

```txt
context_goblin_read
context_goblin_refresh
context_goblin_status
```

## Cache location

```txt
.opencode/cache/context-goblin/project-context.md
.opencode/cache/context-goblin/project-context.state.json
```

## Does it actually save context?

Context Goblin includes a benchmark fixture that compares two OpenCode runs:

```txt
Baseline:
  OpenCode analyzes the project without Context Goblin.

Context Goblin:
  OpenCode starts from `.opencode/cache/context-goblin/project-context.md`.
```

The benchmark reports:

```txt
- unique files read
- tool calls
- cache size
- secret leakage check
- input/output/cache token totals from OpenCode JSON events
- cost and duration when OpenCode reports them
```

The baseline run uses an isolated empty `OPENCODE_CONFIG_DIR` so globally installed plugins cannot affect the control run. The Context Goblin run loads the plugin and instructs the agent to call `context_goblin_status`, `context_goblin_refresh`, and `context_goblin_read` before broad scanning.

The goal is not to fake exact token savings. Token usage varies by model, provider, and cache state. The benchmark proves the agent starts from a compact cache, avoids denied files, reports token/cost evidence, and reads fewer files when the model behavior allows a direct comparison.

Run:

```bash
npm run benchmark
```

If your provider is slow, increase the per-run timeout:

```bash
CONTEXT_GOBLIN_BENCHMARK_TIMEOUT_MS=300000 npm run benchmark
```

Output:

```txt
benchmark-results/context-goblin-benchmark.md
```

Raw OpenCode JSON event logs are also saved:

```txt
benchmark-results/baseline-events.jsonl
benchmark-results/goblin-events.jsonl
```

The report includes:

```txt
- baseline vs Context Goblin tool counts
- built-in read/bash/glob/grep calls
- unique files read
- Context Goblin tool usage
- cache size and line count
- input/output/reasoning/cache token totals
- cost and duration
- secret leakage and denied-file checks
- pass/fail summary
```

If OpenCode or the provider stalls, the report still gets written with diagnostics instead of silently hanging.

## Real OpenCode check

Run a real non-interactive OpenCode workflow that forces the agent to call Context Goblin before summarizing a fixture project:

```bash
npm run check:opencode
```

The check asserts that OpenCode calls:

```txt
context_goblin_status
context_goblin_refresh
context_goblin_read
```

It also verifies that the cache files exist, required headings are present, React/Vite/TypeScript are detected, the cache stays compact, and fake secrets do not leak.

## GPT-5.5 example

Run a publishable proof check against a clean synthetic React/Vite/TypeScript fixture with `openai/gpt-5.5`:

```bash
OPENCODE_MODEL=openai/gpt-5.5 npm run check:opencode:gpt55
```

Output:

```txt
examples/gpt-5.5-cache-check.md
```

Latest local result:

```txt
Model: openai/gpt-5.5
OpenCode completed: true
Result: pass
Tool calls: context_goblin_status, context_goblin_refresh, context_goblin_read
Cache size: 1063 bytes
Secret leakage: none detected
Input tokens: 7752
Output tokens: 222
Cache read tokens: 17920
```

The generated report is sanitized and safe to commit. Raw OpenCode JSON events are written to `examples/gpt-5.5-cache-check.events.jsonl` and ignored by git.

## Safety model

Context Goblin should never cache secrets or generated dependency files.

Default exclusions include:

```txt
.env
.env.*
*.pem
*.key
node_modules/**
.git/**
dist/**
build/**
coverage/**
.next/**
.nuxt/**
.output/**
```

## Development status

This project is currently in early MVP development.

## License

MIT
