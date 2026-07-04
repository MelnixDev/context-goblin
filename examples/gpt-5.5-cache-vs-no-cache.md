# GPT-5.5 Context Goblin Cache vs No Cache

Generated: 2026-07-04T21:41:35.902Z
Model: openai/gpt-5.5
OpenCode version: 1.17.13
Context Goblin version: 0.1.1-alpha.1

## Fixture

- Type: synthetic React/Vite/TypeScript project
- Secret files: yes, fake only
- Entry point: src/main.tsx
- Baseline: no Context Goblin plugin
- Context Goblin: project-local plugin shim enabled

## Prompts

### Baseline

```txt
No Context Goblin is available in this baseline run. Read package.json, tsconfig.json, vite.config.ts, src/main.tsx, and src/App.tsx using normal OpenCode tools. Then answer in one concise paragraph with stack, package manager, commands, entry point, safety exclusions you would apply, and smallest files to inspect next. Do not modify files and do not read .env.
```

### Context Goblin

```txt
Call context_goblin_status. If missing or stale, call context_goblin_refresh. Then call context_goblin_read. Final answer: one concise paragraph with stack, package manager, commands, entry point, safety exclusions, and smallest files to inspect next. Do not modify files.
```

## Run Status

- Baseline completed: true
- Context Goblin completed: true
- Context Goblin validation: pass

## Baseline: No Cache

- Duration: 39000ms
- Tool calls: 5
- Unique files read: 5
- Input tokens: 7504
- Output tokens: 486
- Reasoning tokens: 26
- Cache read tokens: 5632
- Cache write tokens: 0
- Total event tokens: 13648
- Cost: 0

### Baseline Tool Counts

- read: 5

### Baseline Files Read

- package.json
- src/App.tsx
- src/main.tsx
- tsconfig.json
- vite.config.ts

### Baseline Final Answer

```txt
Stack is React + TypeScript + Vite with Vitest; package manager is not identifiable from the requested files because no lockfile was read, so use the repo’s existing lockfile if present; commands are `vite` via `npm run dev`, `tsc && vite build` via `npm run build`, and `vitest` via `npm test`; entry point is `src/main.tsx`, which re-exports `App` from `src/App.tsx`; safety exclusions: do not read `.env`, secrets, generated output like `dist`, dependency folders like `node_modules`, or unrelated dotfiles unless needed; smallest next files to inspect would be `index.html`, any lockfile, and test files matching `*.test.*` or `*.spec.*`.
```

## Context Goblin: Cache First

- Duration: 74000ms
- Tool calls: 3
- Unique files read through built-in tools: 0
- context_goblin_status called: yes
- context_goblin_refresh called: yes
- context_goblin_read called: yes
- Cache markdown exists: yes
- State JSON exists: yes
- Cache size: 1045 bytes
- Cache lines: 64
- Secret leakage: none detected
- Input tokens: 2074
- Output tokens: 172
- Reasoning tokens: 0
- Cache read tokens: 23552
- Cache write tokens: 0
- Total event tokens: 25798
- Cost: 0

### Context Goblin Tool Counts

- context_goblin_read: 1
- context_goblin_refresh: 1
- context_goblin_status: 1

### Context Goblin Files Read

- none observed

### Context Goblin Final Answer

```txt
Stack: TypeScript with React, Vite, and Node.js; package manager: needs input; commands: `vite`, `tsc && vite build`, `vitest`; entry point: `src/main.tsx`; safety exclusions include env/secrets, keys, `node_modules/**`, `.git/**`, build outputs, coverage, and `.opencode/cache/context-goblin/**`; smallest files to inspect next: `package.json`, `src/main.tsx`, `src/App.tsx`, `vite.config.ts`, `tsconfig.json`.
```

## Comparison

- File-read reduction: 100%
- Input-token change: 72%
- Baseline read files directly: yes
- Context Goblin started from cache: yes
- Cache stayed <= 25 KB: yes
- Secret leakage: pass

## Result

Pass/fail: pass

Conclusion: GPT-5.5 completed both runs. The baseline inspected project files directly; Context Goblin used status, refresh, and read to start from a compact safe cache.

## Diagnostics

### Baseline stderr

```txt
none
```

### Context Goblin stderr

```txt
none
```
