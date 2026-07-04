# GPT-5.5 Context Goblin Cache Check

Generated: 2026-07-04T18:33:04.251Z
Model: openai/gpt-5.5
OpenCode version: 1.17.13
Context Goblin version: 0.1.0

## Fixture

- Type: synthetic React/Vite/TypeScript project
- Secret files: yes, fake only
- Entry point: src/main.tsx
- Generated in: <temporary fixture>

## Prompt

```txt
Call context_goblin_status. If missing or stale, call context_goblin_refresh. Then call context_goblin_read. Final answer: one concise paragraph with stack, package manager, commands, entry point, safety exclusions, and smallest files to inspect next. Do not modify files.
```

## Run Status

- OpenCode completed: true
- Duration: 27000ms
- Result: pass

## Tool Calls Observed

- context_goblin_status: yes
- context_goblin_refresh: yes
- context_goblin_read: yes

### Tool Counts

- context_goblin_read: 1
- context_goblin_refresh: 1
- context_goblin_status: 1

## Cache Result

- Markdown exists: yes
- State JSON exists: yes
- Cache size: 1063 bytes
- Cache lines: 65
- Required headings present: yes
- React/Vite/TypeScript detected: yes
- Entry point detected: yes
- Secret leakage: none detected
- Cache size <= 25 KB: yes

## Cache Summary

- Stack: React, Vite, TypeScript
- Commands: dev, build, test
- Entry points: src/main.tsx
- Safety exclusions include: .env, node_modules, dist, build, coverage, .git, cache internals

## GPT-5.5 Behavior

```txt
Stack: TypeScript with React, Vite, and Node.js; package manager: needs input; commands: `vite` for dev, `tsc && vite build` for build, `vitest` for tests; entry point: `src/main.tsx`; safety exclusions include `.env`, `.env.*`, `*.pem`, `*.key`, `secrets.json`, `credentials.json`, `node_modules/**`, `.git/**`, `dist/**`, `build/**`, `coverage/**`, `.next/**`, `.nuxt/**`, `.output/**`, and `.opencode/cache/context-goblin/**`; smallest files to inspect next are `package.json`, `src/main.tsx`, `src/App.tsx`, `vite.config.ts`, and `tsconfig.json`.
```

## Token/Cost Evidence

- Input tokens: 7752
- Output tokens: 222
- Reasoning tokens: 15
- Cache read tokens: 17920
- Cache write tokens: 0
- Total event tokens: 25909
- Cost: 0

## Diagnostics

### Missing Headings

- none

### Error

```txt
none
```

## Result

Pass/fail: pass

Conclusion: GPT-5.5 used Context Goblin first, read the compact cache, and no fake secrets leaked.
