# Context Goblin

OpenCode plugin that creates a compact, safe project-context cache so agents can start from cached project facts instead of rediscovering the repo.

## Install

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
```

Cache files:

```txt
.opencode/cache/context-goblin/project-context.md
.opencode/cache/context-goblin/project-context.state.json
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
npm run smoke:opencode
npm run check:opencode
```

## GPT-5.5 Cache Check

Run a real OpenCode/GPT-5.5 check on a clean synthetic React/Vite/TypeScript fixture:

```bash
OPENCODE_MODEL=openai/gpt-5.5 npm run check:opencode:gpt55
```

Report:

```txt
examples/gpt-5.5-cache-check.md
```

Latest result:

```txt
Result: pass
Tool calls: context_goblin_status, context_goblin_refresh, context_goblin_read
Cache size: 1063 bytes
Secret leakage: none detected
Input tokens: 7752
Output tokens: 222
Cache read tokens: 17920
```

## GPT-5.5 A/B Test

Run a no-cache vs cache comparison on two identical synthetic fixtures:

```bash
OPENCODE_MODEL=openai/gpt-5.5 npm run check:opencode:gpt55:ab
```

Report:

```txt
examples/gpt-5.5-cache-vs-no-cache.md
```

The baseline has no Context Goblin plugin and asks GPT-5.5 to inspect project files directly. The cache run enables Context Goblin and requires `context_goblin_status`, `context_goblin_refresh`, and `context_goblin_read` before answering.

Latest A/B result:

```txt
Result: pass
Baseline direct file reads: 5
Context Goblin built-in file reads: 0
File-read reduction: 100%
Input-token reduction: 72%
Context Goblin cache size: 1045 bytes
Secret leakage: none detected
```

Raw OpenCode event logs are written to `examples/*.events.jsonl` and ignored by git.

## Benchmark

```bash
npm run benchmark
```

Output:

```txt
benchmark-results/context-goblin-benchmark.md
```

The benchmark reports tool calls, inferred file reads, cache size, token/cost evidence, secret leakage, denied-file checks, and diagnostics if OpenCode/provider stalls.

## License

MIT
