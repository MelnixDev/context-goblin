# Free Models Context Goblin A/B Report

Generated: 2026-07-04T22:04:04.834Z
OpenCode version: 1.17.13
Context Goblin version: 0.1.1-alpha.2

## Models

- opencode/deepseek-v4-flash-free
- opencode/mimo-v2.5-free
- opencode/nemotron-3-ultra-free
- opencode/north-mini-code-free

## Summary

| Model | Baseline OK | Goblin OK | Baseline Reads | Goblin Reads | File Reduction | Input Token Change | Cache Size | Secret Leak | Result |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| opencode/deepseek-v4-flash-free | yes | yes | 5 | 0 | 100% | 1% | 1045 | pass | pass |
| opencode/mimo-v2.5-free | yes | yes | 5 | 0 | 100% | 0% | 1045 | pass | pass |
| opencode/nemotron-3-ultra-free | yes | yes | 5 | 0 | 100% | 19% | 1045 | pass | pass |
| opencode/north-mini-code-free | yes | yes | 5 | 0 | 100% | 44% | 1045 | pass | pass |

## opencode/deepseek-v4-flash-free

### Summary

- Baseline completed: true
- Context Goblin completed and validated: true
- Baseline direct file reads: 5
- Context Goblin built-in file reads: 0
- File-read reduction: 100%
- Input-token change: 1%
- Cache size: 1045 bytes
- Secret leakage: none detected

### Baseline

- Duration: 20000ms
- Tool calls: 6
- Input tokens: 8922
- Output tokens: 659
- Reasoning tokens: 689
- Cache read tokens: 17792
- Total event tokens: 28062
- Cost: 0

Tool counts:

- read: 6

Files read:

- package.json
- src/App.tsx
- src/main.tsx
- tsconfig.json
- vite.config.ts

Final answer:

```txt
**Stack:** React + TypeScript (strict mode, `react-jsx` transform), Vite with `@vitejs/plugin-react`, Vitest for testing. **Package manager:** npm (no lockfile present). **Commands:** `npm run dev`, `npm run build` (tsc && vite build), `npm test` (vitest). **Entry point:** `index.html` — but it doesn't exist yet; `src/main.tsx` only re-exports `App` with no `createRoot` call so the project is non-functional. **Safety exclusions:** `.env`, `node_modules/`, `dist/`, `.git/`. **Smallest files to inspect next:** all 4 source files are already single-line stubs — the next useful thing to inspect is `.env` and to notice that `index.html` and a proper render call in `main.tsx` are missing.
```

### Context Goblin

- Duration: 22000ms
- Tool calls: 3
- context_goblin_status: yes
- context_goblin_refresh: yes
- context_goblin_read: yes
- Input tokens: 8826
- Output tokens: 260
- Reasoning tokens: 106
- Cache read tokens: 24832
- Total event tokens: 34024
- Cost: 0

Tool counts:

- context_goblin_read: 1
- context_goblin_refresh: 1
- context_goblin_status: 1

Files read:

- none observed

Final answer:

```txt
**Stack:** TypeScript + React + Vite (Node.js). **Package manager:** npm (implied by `package-lock.json`). **Commands:** `vite` (dev), `tsc && vite build` (build), `vitest` (test). **Entry point:** `src/main.tsx`. **Safety exclusions:** `.env*`, `*.pem`, `*.key`, `secrets.json`, `credentials.json`, `node_modules/`, `.git/`, `dist/`, `build/`, `coverage/`, `.next/`, `.nuxt/`, `.output/`, `.opencode/cache/`. **Smallest files to inspect next:** `package.json`, `src/App.tsx`, `vite.config.ts`, `tsconfig.json`.
```

## opencode/mimo-v2.5-free

### Summary

- Baseline completed: true
- Context Goblin completed and validated: true
- Baseline direct file reads: 5
- Context Goblin built-in file reads: 0
- File-read reduction: 100%
- Input-token change: 0%
- Cache size: 1045 bytes
- Secret leakage: none detected

### Baseline

- Duration: 21000ms
- Tool calls: 5
- Input tokens: 8283
- Output tokens: 501
- Reasoning tokens: 278
- Cache read tokens: 9344
- Total event tokens: 18406
- Cost: 0

Tool counts:

- read: 5

Files read:

- package.json
- src/App.tsx
- src/main.tsx
- tsconfig.json
- vite.config.ts

Final answer:

```txt
This is a **React + TypeScript** project built with **Vite**, using `@vitejs/plugin-react` for JSX support and `vitest` for testing. No lock file was found, so the package manager is ambiguous (likely **npm** given the `scripts` structure). Available commands are `dev` (vite), `build` (tsc && vite build), and `test` (vitest). The entry point is `src/main.tsx`, which re-exports `App` from `src/App.tsx`. Safety exclusions I would apply: `.env`, `node_modules/`, and `dist/`. The smallest files to inspect next are `src/App.tsx` (already reviewed—it renders a single `<main>` element) and `vite.config.ts` (currently empty), followed by any additional source files under `src/`.
```

### Context Goblin

- Duration: 29000ms
- Tool calls: 3
- context_goblin_status: yes
- context_goblin_refresh: yes
- context_goblin_read: yes
- Input tokens: 8323
- Output tokens: 237
- Reasoning tokens: 138
- Cache read tokens: 26624
- Total event tokens: 35322
- Cost: 0

Tool counts:

- context_goblin_read: 1
- context_goblin_refresh: 1
- context_goblin_status: 1

Files read:

- none observed

Final answer:

```txt
This is a **React + Vite + TypeScript** project. The package manager isn't detected from lockfiles (check if `package-lock.json`, `yarn.lock`, or `pnpm-lock.yaml` exists). Commands: `vite` (dev), `tsc && vite build` (build), `vitest` (test). Entry point: `src/main.tsx`. Safety exclusions: `.env`, `*.pem`, `*.key`, `secrets.json`, `credentials.json`, plus `node_modules/`, `.git/`, `dist/`, `build/`, `coverage/`, `.next/`, `.nuxt/`, `.output/`, and `.opencode/cache/`. Smallest files to inspect next: `src/main.tsx`, `src/App.tsx`, `vite.config.ts`, `package.json`, `tsconfig.json`.
```

## opencode/nemotron-3-ultra-free

### Summary

- Baseline completed: true
- Context Goblin completed and validated: true
- Baseline direct file reads: 5
- Context Goblin built-in file reads: 0
- File-read reduction: 100%
- Input-token change: 19%
- Cache size: 1045 bytes
- Secret leakage: none detected

### Baseline

- Duration: 104000ms
- Tool calls: 5
- Input tokens: 17973
- Output tokens: 494
- Reasoning tokens: 223
- Cache read tokens: 0
- Total event tokens: 18690
- Cost: 0

Tool counts:

- read: 5

Files read:

- package.json
- src/App.tsx
- src/main.tsx
- tsconfig.json
- vite.config.ts

Final answer:

```txt
**Stack**: React 18 + TypeScript + Vite (minimal config). **Package manager**: npm (no lockfile visible). **Commands**: `npm run dev` (vite), `npm run build` (tsc + vite build), `npm test` (vitest). **Entry point**: `src/main.tsx` exports `App` from `src/App.tsx`. **Safety exclusions**: `.env*`, `node_modules/`, `dist/`, `.git/`. **Smallest files to inspect next**: All config/source files are already 1 line each; check `src/` for additional components via `ls src/`.
```

### Context Goblin

- Duration: 51000ms
- Tool calls: 4
- context_goblin_status: yes
- context_goblin_refresh: yes
- context_goblin_read: yes
- Input tokens: 14512
- Output tokens: 219
- Reasoning tokens: 182
- Cache read tokens: 30464
- Total event tokens: 45377
- Cost: 0

Tool counts:

- bash: 1
- context_goblin_read: 1
- context_goblin_refresh: 1
- context_goblin_status: 1

Files read:

- none observed

Final answer:

```txt
This is a minimal **React + Vite + TypeScript** fixture project for testing the **context-goblin** Vite plugin. Key files:

- **package.json** - Minimal deps: React, Vite, React plugin, Vitest
- **vite.config.ts** - Vite config with the context-goblin plugin
- **src/main.tsx** + **src/App.tsx** - Minimal React app
- **.opencode/plugins/context-goblin.js** - The context-goblin Vite plugin

The cache shows it's a fixture project for testing the context-goblin Vite plugin (located at `.opencode/plugins/context-goblin.js`).

What would you like to do with this project?
```

## opencode/north-mini-code-free

### Summary

- Baseline completed: true
- Context Goblin completed and validated: true
- Baseline direct file reads: 5
- Context Goblin built-in file reads: 0
- File-read reduction: 100%
- Input-token change: 44%
- Cache size: 1045 bytes
- Secret leakage: none detected

### Baseline

- Duration: 19000ms
- Tool calls: 22
- Input tokens: 51035
- Output tokens: 415
- Reasoning tokens: 646
- Cache read tokens: 0
- Total event tokens: 52092
- Cost: 0

Tool counts:

- bash: 2
- read: 20

Files read:

- package.json
- src/App.tsx
- src/main.tsx
- tsconfig.json
- vite.config.ts

Final answer:

```txt
Stack: React 18 with Vite dev server using TypeScript. Package manager is npm (default). Entry point is src/main.tsx which renders the App component. Safety exclusions: exclude node_modules/, dist/, cache/, build/ outputs, and .git directories. Smallest files to inspect next: vite.config.ts (1 line), tsconfig.json (1 line), and App.tsx (1 line) to analyze the minimal setup.
```

### Context Goblin

- Duration: 22000ms
- Tool calls: 3
- context_goblin_status: yes
- context_goblin_refresh: yes
- context_goblin_read: yes
- Input tokens: 28683
- Output tokens: 116
- Reasoning tokens: 306
- Cache read tokens: 0
- Total event tokens: 29100
- Cost: 0

Tool counts:

- context_goblin_read: 1
- context_goblin_refresh: 1
- context_goblin_status: 1

Files read:

- none observed

Final answer:

```txt
The project is a TypeScript application using React, Vite, and Node.js with Vite as the package manager and dev command, `tsc && vite build` for builds, and `vitest` for tests. The entry point is src/main.tsx, with safety exclusions preventing reading of .env files, secrets, node_modules, .git, dist, build, coverage, and other sensitive directories. The smallest files to inspect next are package.json, src/main.tsx, tsconfig.json, and vite.config.ts.
```
