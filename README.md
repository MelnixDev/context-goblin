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
npm run check:reports
npm run smoke:opencode
npm run check:models:general
```

## Latest A/B Result

Run the current general model A/B benchmark:

```bash
MODEL_GROUP=standard npm run check:models:general
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

Negative token reduction means the Context Goblin run used more input tokens than the baseline. Raw OpenCode event logs are written to `examples/*.events.jsonl` and ignored by git.

## License

MIT
