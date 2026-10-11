# Context Goblin OpenCode V2 A/B Report

Run started: 2026-10-11T13:37:10.715Z
Run completed: 2026-10-11T18:59:44.798Z
Report regenerated from verified saved results: 2026-10-11T19:02:00.519Z
OpenCode version: opencode v2.0.26
Context Goblin version: 0.2.2
Protocol: v2-single-call-cold-v1
Reasoning variant: low
Fixture SHA-256: d091f74e04a8eca5d770d0979ce1495f4c03f1e5d35d9d87d147a76a8ae5f566

## Summary

| Model | Baseline reads | Goblin reads | Read reduction | Input reduction | Total reduction | Coverage baseline/Goblin | Compatibility | Efficiency |
| --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |
| openai/gpt-6-sol | 12 | 7 | 42% | 18% | 33% | 6/6 / 6/6 | pass | pass |
| openai/gpt-6.1-sol | 16 | 6 | 63% | 27% | 48% | 6/6 / 6/6 | pass | pass |

One cold-cache session per arm and model. This is initial evidence, not a stability result. Baseline runs first for GPT 6 Sol; Goblin runs first for GPT 6.1 Sol. Provider cache state is not controlled.

Counts come from a read-only observer of native tool completion hooks and session.step.ended events, including calls made through codemode. Unique completed read paths are counted; errors and cumulative usage updates are excluded. Total tokens sum disjoint step input, visible output, reasoning, cache-read, and cache-write counters. Auxiliary model requests and provider invoice totals are outside this measurement.

Both arms use the same fixture and task, a 12-step limit, and an isolated global config. Permissions deny edits, shell, subagents, web access, and .env reads. Only Goblin loads the cache plugin. It starts without a pre-generated cache and must call context_goblin_get once before discovery. No output compaction is enabled.

Coverage is a six-topic lexical checklist, not an independent correctness score. Raw answers and files inspected are listed below. Negative reductions indicate increased usage and fail efficiency. See [run history](./opencode-v2-ab-status.md) for interruptions and resume timing.

## openai/gpt-6-sol

### baseline

Tokens: {"input":4341,"output":652,"reasoning":0,"cacheRead":6144,"cacheWrite":0,"total":11137}

Steps: 4; duration: 15902 ms; cache: 0 bytes; reported step cost: 0

Tools: {"glob":3,"read":13}

Files read:

- AGENTS.md
- README.md
- package.json
- src/App.tsx
- src/components/Button.tsx
- src/components/Header.tsx
- src/features/cart/CartDrawer.tsx
- src/features/cart/cartStore.ts
- src/features/catalog/ProductCard.tsx
- src/features/catalog/ProductList.tsx
- src/routes.tsx
- tests/cartStore.test.ts

Answer:

~~~~text
## Stack
React, TypeScript, Vite, and an in-memory cart store; Vitest covers cart behavior. Available commands: `npm run dev`, `npm run build`, `npm test`, `npm run lint`.

## Files
`src/features/cart/cartStore.ts` owns cart state. `src/features/cart/CartDrawer.tsx` renders cart actions. `src/features/catalog/ProductCard.tsx` adds products; `src/routes.tsx` mounts the drawer. Extend `tests/cartStore.test.ts`.

## Plan
Add a separate saved-items collection and store functions to move an item from cart to saved and back, preserving its product details and quantity. In `CartDrawer.tsx`, show a **Save for later** action per cart item and a **Saved for later** section with a **Move to cart** action. Keep saved items out of active-cart displays.

## Risks
The store currently mutates module-level arrays, and components have no subscription or rerender mechanism. Plan a reactive update path so actions immediately update the UI. Decide how moving back merges quantities if the product is already in the cart. State is memory-only, so saved items will not survive a reload unless persistence is separately requested.

## Tests
Cover save, restore, quantity preservation, duplicate-item merging, and clearing/resetting both collections in `tests/cartStore.test.ts`; add UI interaction tests if the test setup supports them.

## Safety
No files were modified, `.env` was not read, and no commands were run.
~~~~


### goblin

Tokens: {"input":3540,"output":488,"reasoning":0,"cacheRead":3456,"cacheWrite":0,"total":7484}

Steps: 3; duration: 11170 ms; cache: 2280 bytes; reported step cost: 0

Tools: {"context_goblin_get":1,"read":7}

Files read:

- AGENTS.md
- package.json
- src/features/cart/CartDrawer.tsx
- src/features/cart/cartStore.ts
- src/features/catalog/ProductCard.tsx
- src/routes.tsx
- tests/cartStore.test.ts

Answer:

~~~~text
## Stack
React, TypeScript, Vite, and Vitest. `package.json` provides `dev`, `build`, `test`, and `lint` scripts; the package manager is unspecified.

## Files
Implement in `src/features/cart/cartStore.ts` and `src/features/cart/CartDrawer.tsx`. Extend `tests/cartStore.test.ts`. `src/features/catalog/ProductCard.tsx` defines the product type and add-to-cart behavior; `src/routes.tsx` already displays the drawer beside the catalog.

## Plan
Keep a separate saved-items collection in `cartStore.ts`. Add actions to move an item, including its quantity, from cart to saved and back; prevent duplicate product IDs if an item is added while saved. In `CartDrawer.tsx`, show separate **Cart** and **Saved for later** sections with **Save for later** and **Move to cart** buttons. Because the current store is a plain array with no subscriptions, add a reactive update mechanism so button actions visibly refresh the drawer.

## Risks
Define how quantities merge when moving a saved product into a cart that already contains it. Decide whether `clearCart()` clears only the cart or also saved items; provide a separate test-reset path if saved items should persist.

## Tests
Extend `tests/cartStore.test.ts` for both moves, quantity preservation or merging, duplicate prevention, removal, and clearing semantics. Run the package manager’s `test`, `build`, and `lint` scripts when implementation is authorized.

## Safety
Planning only: no files modified, `.env` read, commands run, or diagnostics performed.
~~~~

## openai/gpt-6.1-sol

### baseline

Tokens: {"input":4741,"output":808,"reasoning":0,"cacheRead":8832,"cacheWrite":0,"total":14381}

Steps: 5; duration: 31717 ms; cache: 0 bytes; reported step cost: 0

Tools: {"read":17,"glob":3}

Files read:

- AGENTS.md
- README.md
- package.json
- src/App.tsx
- src/api/client.ts
- src/components/Button.tsx
- src/components/Header.tsx
- src/features/cart/CartDrawer.tsx
- src/features/cart/cartStore.ts
- src/features/catalog/ProductCard.tsx
- src/features/catalog/ProductList.tsx
- src/main.tsx
- src/routes.tsx
- src/styles/theme.css
- tests/cartStore.test.ts
- vite.config.ts

Answer:

~~~~text
## Stack
React, TypeScript, Vite; Vitest tests. Zustand is installed but unused. Available commands: `npm run dev`, `npm run build`, `npm test`, `npm run lint`.

## Files
- `src/features/cart/cartStore.ts`: state and actions.
- `src/features/cart/CartDrawer.tsx`: cart/saved UI.
- `src/features/catalog/ProductCard.tsx`: existing add action.
- `src/styles/theme.css`: section styling.
- `tests/cartStore.test.ts`: extend coverage.
- Proposed `tests/CartDrawer.test.tsx`: UI coverage.

`src/routes.tsx` already renders the drawer; no routing change needed.

## Plan
Replace nonreactive module state with a subscribed Zustand store, retaining existing exported helpers for callers/tests.

Add `savedItems`, `saveForLater(id)`, `moveToCart(id)`, and `removeSaved(id)`:
- Save: move the entire cart line, preserving quantity, into saved items.
- Restore: move back, merging quantities for matching product IDs.
- Repeated/missing-ID actions: no-op; unique IDs per collection.
- Adding a saved product: create/increment an active line; leave saved quantity unchanged.
- Keep `clearCart()` active-only; provide explicit full reset for tests.

Show product name, quantity, price, “Save for later,” and existing removal controls. Add a labelled saved section with “Move to cart,” “Remove,” and empty states.

## Risks
Current mutations do not trigger React updates. No persistence/backend integration exists; defer persistence. Confirm merge semantics. UI tests require additional tooling; lint configuration and application mounting appear incomplete.

## Tests
Cover quantity preservation, merges, missing IDs, repeated actions, removal/reset isolation, existing add/remove behavior, reactive rendering, and accessible controls.

## Safety
Read-only inspection; no files modified, commands executed, or `.env` read.
~~~~


### goblin

Tokens: {"input":3476,"output":546,"reasoning":0,"cacheRead":3456,"cacheWrite":0,"total":7478}

Steps: 3; duration: 19406 ms; cache: 2280 bytes; reported step cost: 0

Tools: {"context_goblin_get":1,"read":6}

Files read:

- AGENTS.md
- package.json
- src/features/cart/CartDrawer.tsx
- src/features/cart/cartStore.ts
- src/features/catalog/ProductCard.tsx
- tests/cartStore.test.ts

Answer:

~~~~text
## Stack
React, TypeScript, Vite; Zustand installed but unused by the cart. Vitest tests.
Available scripts: `npm run dev`, `npm run build`, `npm test -- --run`, `npm run lint`. Package manager is unconfirmed.

## Files
- `src/features/cart/cartStore.ts`: state and actions.
- `src/features/cart/CartDrawer.tsx`: cart/saved UI.
- `src/features/catalog/ProductCard.tsx`: reactive add integration.
- `tests/cartStore.test.ts`: extend behavior coverage.
- Proposed `tests/CartDrawer.test.tsx`: interaction coverage.
- `package.json`: UI-test dependencies if needed.

## Plan
Replace nonreactive module arrays with a Zustand store, retaining existing action exports.
- **Cart → saved:** `saveForLater(id)` transfers the entire item, preserving quantity.
- **Saved → cart:** `moveToCart(id)` transfers it back; merge quantities when already active.
- **Saved → removed:** `removeSavedItem(id)`.
- Missing IDs are no-ops; repeated transfers cannot duplicate items.
- Catalog additions remain active-cart additions, independent of saved items.

Subscribe `CartDrawer` to both collections. Show item name/quantity, “Remove,” and “Save for later”; add a separate “Saved for later” section with “Move to cart,” removal, and empty states.

## Risks
Current mutations cannot trigger React rerenders. Avoid mutable snapshots. Confirm duplicate-merge semantics and whether saved items should persist across reloads; default to session-memory scope. Keep `clearCart()` active-only; provide a full-state reset for tests.

## Tests
Cover quantity preservation, merging, removal, missing IDs, repeated actions, reset isolation, and existing add/remove behavior. UI tests should verify immediate updates and accessible action labels.

## Safety
Context Goblin called exactly once before discovery. Only focused reads followed. No files modified, `.env` read, or commands executed.
~~~~

