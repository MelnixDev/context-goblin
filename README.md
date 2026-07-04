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
- optional token/cost stats when available
```

The goal is not to fake exact token savings. The goal is to prove that the agent reads fewer files and starts from a compact cache.

Run:

```bash
npm run benchmark
```

Output:

```txt
benchmark-results/context-goblin-benchmark.md
```

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
