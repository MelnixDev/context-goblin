# General Model Context Goblin A/B Report

Generated: 2026-08-31T17:59:02.440Z
OpenCode version: 1.18.20
Context Goblin version: 0.1.19
Model group: custom

## Task

Plan where and how to add a "Save for later" feature to a realistic React/Vite cart and catalog app. The model must not modify files or read .env.

## Protocol

- Each arm receives a fresh copy of the same synthetic fixture.
- The `task`, `bash`, and `edit` tools are explicitly denied so repository reads remain visible and comparable in the parent OpenCode event stream.
- Models may use direct `read`, `glob`, and `grep` tools; the Context Goblin arm may additionally use Context Goblin tools.
- Results are one run per model and arm. Model behavior and provider token accounting can vary between runs.

## Summary

| Model | Baseline OK | Tool Use OK | Answer OK | Baseline Reads | Goblin Reads | File Reduction | Input Token Reduction | Quality | Cache Size | Secret Leak | Result |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| openai/gpt-5.5 | yes | yes | yes | 16 | 7 | 56% | 8% | 6/6 | 2598 | pass | pass |
| openai/gpt-5.6-sol | yes | yes | yes | 17 | 14 | 18% | 34% | 6/6 | 2598 | pass | pass |

## openai/gpt-5.5

### Summary

- Baseline completed: true
- Context Goblin completed and validated: true
- Tool use OK: true
- Answer OK: true
- Result: pass
- Baseline direct file reads: 16
- Context Goblin built-in file reads: 7
- File-read reduction: 56%
- File-read status: pass
- Input-token reduction: 8%
- Input-token status: pass
- Total-token reduction: 26%
- Total-token status: pass
- Quality score: 6/6
- Quality hits: cartStore.ts, CartDrawer.tsx, catalog product file, tests, risks, safety exclusions
- Required quality hits: save-for-later feature, cart state, cart UI, cart tests
- Quality disqualifiers: none
- Cache size: 2598 bytes
- Secret leakage: none detected
- Baseline errors: 0
- Context Goblin errors: 0

### Baseline

- Duration: 61000ms
- Tool calls: 20
- Input tokens: 11196
- Output tokens: 2274
- Reasoning tokens: 275
- Cache read tokens: 32256
- Total event tokens: 46001
- Cost: 0

Tool counts:

- glob: 2
- grep: 2
- read: 16

Files read:

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
- tsconfig.json
- vite.config.ts

Errors:

- none

Final answer:

```txt
**Stack**
- React + TypeScript + Vite.
- Tests: Vitest.
- State: currently plain module-level arrays in `src/features/cart/cartStore.ts`; `zustand` is installed but not used.
- Styling: minimal CSS in `src/styles/theme.css`.

**Inspection Commands**
- Used `glob` for `**/*`.
- Used `grep` for `cart|Cart|basket|Basket`.
- Used `grep` for `save for later|saved|wishlist|later|Saved`.
- Used `glob` for `**/*.{test,spec}.{ts,tsx,js,jsx}`.
- Used `read` only for focused file inspection.
- No shell commands were run.
- No files were modified.

**Entry Points**
- App entry/export: `src/main.tsx`
- App composition: `src/App.tsx`
- Route composition: `src/routes.tsx`
- Catalog add-to-cart UI: `src/features/catalog/ProductCard.tsx`
- Cart drawer UI: `src/features/cart/CartDrawer.tsx`
- Cart behavior/state: `src/features/cart/cartStore.ts`
- Existing cart tests: `tests/cartStore.test.ts`

**Exact Files Inspected**
- `package.json`
- `README.md`
- `tsconfig.json`
- `vite.config.ts`
- `src/main.tsx`
- `src/App.tsx`
- `src/routes.tsx`
- `src/api/client.ts`
- `src/components/Button.tsx`
- `src/components/Header.tsx`
- `src/styles/theme.css`
- `src/features/cart/cartStore.ts`
- `src/features/cart/CartDrawer.tsx`
- `src/features/catalog/ProductCard.tsx`
- `src/features/catalog/ProductList.tsx`
- `tests/cartStore.test.ts`
- `AGENTS.md` was surfaced by grep output only; `.env` was not read.

**Implementation Plan**
1. Extend `src/features/cart/cartStore.ts` with a separate saved-for-later collection:
   - Add `let savedItems: CartItem[] = []` or a narrower saved item type.
   - Export `saveForLater(productId: string)`.
   - Export `moveSavedToCart(productId: string)`.
   - Export `removeFromSaved(productId: string)`.
   - Export `getSavedItems()`.
   - Update `clearCart()` to clear both cart and saved items for test isolation.

2. Define expected behavior:
   - `saveForLater(productId)` finds the cart item, removes it from `items`, and adds/merges it into `savedItems`.
   - If item already exists in saved, preserve or increment quantity consistently. I would preserve cart quantity by adding it to existing saved quantity.
   - `moveSavedToCart(productId)` reverses the operation, merging quantity into cart if already present.
   - Unknown IDs should be no-ops, matching current `removeFromCart` style.

3. Update `src/features/cart/CartDrawer.tsx`:
   - Import new store functions.
   - Render cart items with both `Remove` and `Save for later` actions.
   - Render a saved-for-later section below cart items.
   - Include actions to `Move to cart` and optionally `Remove saved`.
   - Keep implementation minimal because current UI has no reactive state mechanism; current pattern already calls store functions directly.

4. Add focused tests in `tests/cartStore.test.ts`:
   - Saving an item removes it from cart and exposes it via `getSavedItems()`.
   - Moving saved item back to cart removes it from saved.
   - Saving duplicate/quantity behavior is covered.
   - `clearCart()` clears both active cart and saved-for-later state.

**Risks**
- Current cart store is not reactive. Clicking buttons mutates module state but may not trigger React re-render. This is already a problem for remove/add visibility and would also affect save-for-later UI.
- `getCartItems()` currently returns the mutable backing array, so tests or UI could mutate store state accidentally.
- `clearCart()` currently only clears active cart; extending it to clear saved items is probably correct for tests, but if persisted saved items were later added, this behavior would need reconsideration.
- `zustand` is installed but unused. Migrating to it would solve reactivity, but it is a larger change than needed unless UI refresh behavior is in scope.
- No persistence exists; saved-for-later would be in-memory only unless explicitly expanded.

**Tests**
- Add/extend `tests/cartStore.test.ts`.
- Run `npm test`.
- Run `npm run build` to verify TypeScript and Vite build.
- Existing lint script is `npm run lint`, but ESLint config was not inspected and may not be configured.

**Safety Exclusions**
- Did not read `.env`.
- Did not use bash.
- Did not use task/subagents.
- Did not modify files.
- Did not inspect unrelated hidden files beyond the surfaced repository listing.
```

### Context Goblin

- Duration: 44000ms
- Tool calls: 11
- context_goblin_status: yes
- context_goblin_refresh: yes
- context_goblin_read: yes
- Input tokens: 10345
- Output tokens: 1441
- Reasoning tokens: 149
- Cache read tokens: 22016
- Total event tokens: 33951
- Cost: 0

Tool counts:

- context_goblin_read: 1
- context_goblin_refresh: 1
- context_goblin_stats: 1
- context_goblin_status: 1
- read: 7

Files read:

- package.json
- src/features/cart/CartDrawer.tsx
- src/features/cart/cartStore.ts
- src/features/catalog/ProductCard.tsx
- src/features/catalog/ProductList.tsx
- src/routes.tsx
- tests/cartStore.test.ts

Errors:

- none

Final answer:

```txt
**Stack**
- TypeScript, React, Vite, Node.js
- State is currently a simple module-level array in `src/features/cart/cartStore.ts`, not Zustand despite dependency.
- Entry point: `src/main.tsx`
- App routing composition: `src/routes.tsx`

**Commands**
- Dev: `vite`
- Build: `tsc && vite build`
- Test: `vitest`
- Lint: `eslint src --ext ts,tsx`

**Files Inspected**
- `package.json`
- `src/features/cart/cartStore.ts`
- `src/features/cart/CartDrawer.tsx`
- `src/features/catalog/ProductCard.tsx`
- `src/features/catalog/ProductList.tsx`
- `src/routes.tsx`
- `tests/cartStore.test.ts`

**Recommended Files To Change**
- `src/features/cart/cartStore.ts`
- `src/features/cart/CartDrawer.tsx`
- `tests/cartStore.test.ts`

Optional only if styling becomes necessary:
- `src/styles/theme.css`

**Implementation Plan**
1. Extend `cartStore.ts` with a saved-for-later collection:
   - Add `SavedItem` type or reuse `Product`.
   - Add `let savedItems: Product[] = []`.
   - Add `getSavedItems()`.
   - Add `saveForLater(productId: string)` that moves an item from cart to saved items and removes it from cart.
   - Add `moveToCart(productId: string)` that moves a saved item back into cart using existing `addToCart`.
   - Update `clearCart()` or add `clearSavedItems()` depending on test isolation needs. For tests, simplest is making `clearCart()` clear both collections if it is the store reset helper.

2. Update `CartDrawer.tsx` UI:
   - Import `getSavedItems`, `saveForLater`, and `moveToCart`.
   - For each cart item, render:
     - `Remove {item.name}`
     - `Save for later {item.name}`
   - Below cart items, render saved items with:
     - `Move to cart {item.name}`
   - Keep changes minimal because current component is only two lines and has no existing design system behavior beyond buttons.

3. Add cart behavior tests in `tests/cartStore.test.ts`:
   - Saving an item removes it from cart.
   - Saving an item adds it to saved items.
   - Moving saved item back adds it to cart.
   - Moving saved item back removes it from saved items.
   - Saving the same product twice should not duplicate saved items, if duplicate prevention is desired.

**Important Risk**
- Current cart state is not reactive. `CartDrawer` calls `getCartItems()` during render, but `addToCart`, `removeFromCart`, and proposed save/move functions do not trigger React rerenders. Existing behavior likely only updates visually when another render happens.
- For a production-quality feature, convert `cartStore.ts` to a real reactive store, likely Zustand since it is already installed. For the smallest change, keep the current pattern and test store behavior only.

**Tests**
- Add/extend `tests/cartStore.test.ts`.
- Run `vitest`.
- Run `tsc && vite build`.
- Run `eslint src --ext ts,tsx`.

**Safety Exclusions**
- Did not read `.env`.
- Did not read secret-looking files.
- Did not inspect denied paths from Context Goblin safety exclusions:
  - `.env`
  - `.env.*`
  - `*.pem`
  - `*.key`
  - `secrets.json`
  - `credentials.json`
  - `node_modules/**`
  - `.git/**`
  - `dist/**`
  - `build/**`
  - `coverage/**`
  - `.next/**`
  - `.nuxt/**`
  - `.output/**`
  - `.opencode/cache/context-goblin/**`

No files were modified.
```

## openai/gpt-5.6-sol

### Summary

- Baseline completed: true
- Context Goblin completed and validated: true
- Tool use OK: true
- Answer OK: true
- Result: pass
- Baseline direct file reads: 17
- Context Goblin built-in file reads: 14
- File-read reduction: 18%
- File-read status: pass
- Input-token reduction: 34%
- Input-token status: pass
- Total-token reduction: -11%
- Total-token status: fail
- Quality score: 6/6
- Quality hits: cartStore.ts, CartDrawer.tsx, catalog product file, tests, risks, safety exclusions
- Required quality hits: save-for-later feature, cart state, cart UI, cart tests
- Quality disqualifiers: none
- Cache size: 2598 bytes
- Secret leakage: none detected
- Baseline errors: 0
- Context Goblin errors: 0

### Baseline

- Duration: 154000ms
- Tool calls: 33
- Input tokens: 12420
- Output tokens: 2981
- Reasoning tokens: 659
- Cache read tokens: 19968
- Total event tokens: 36028
- Cost: 0

Tool counts:

- glob: 11
- grep: 5
- read: 17

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
- tsconfig.json
- vite.config.ts

Errors:

- none

Final answer:

```txt
**Stack**
- React with TypeScript and JSX.
- Vite build tooling.
- Vitest unit tests.
- ESLint.
- Zustand is installed but unused.
- State is currently held in module-level mutable arrays, without persistence or React subscriptions.
- No backend cart API, routing library, DOM test framework, lockfile, or browser-test framework was found.

**Commands**
Defined in `package.json`:
- Development: `npm run dev`
- Build/type-check: `npm run build`
- Tests in watch mode: `npm test`
- One-shot tests: `npm test -- --run`
- Lint: `npm run lint`

No commands were executed because the requested tool restrictions excluded Bash. There is no lockfile, so dependency installation would likely be `npm install`.

**Entry Points**
- Application export: `src/main.tsx`
- Root component: `src/App.tsx`
- Catalog composition: `src/routes.tsx`
- Product-to-cart action: `src/features/catalog/ProductCard.tsx`
- Cart UI: `src/features/cart/CartDrawer.tsx`
- Cart state and behavior: `src/features/cart/cartStore.ts`
- Cart behavior tests: `tests/cartStore.test.ts`

`src/main.tsx` only exports `App`; no `createRoot` call or `index.html` exists in this fixture.

**Files Inspected**
- `AGENTS.md`
- `README.md`
- `package.json`
- `tsconfig.json`
- `vite.config.ts`
- `src/main.tsx`
- `src/App.tsx`
- `src/routes.tsx`
- `src/api/client.ts`
- `src/components/Button.tsx`
- `src/components/Header.tsx`
- `src/styles/theme.css`
- `src/features/catalog/ProductCard.tsx`
- `src/features/catalog/ProductList.tsx`
- `src/features/cart/cartStore.ts`
- `src/features/cart/CartDrawer.tsx`
- `tests/cartStore.test.ts`

Repository-wide focused searches also checked for persistence, Zustand usage, React subscriptions, API routes, checkout logic, DOM-testing tools, additional tests, lockfiles, ESLint configuration, and browser-test configuration.

**Implementation Plan**
1. Extend `src/features/cart/cartStore.ts` with a separate `savedItems: CartItem[]` collection.
2. Add `getSavedItems()`, `saveForLater(productId)`, and `moveToCart(productId)` operations.
3. Make moves atomic: remove the full line and quantity from one collection, then insert or merge it into the other.
4. Use immutable array/item updates rather than mutating `quantity` in place.
5. Add store subscriptions and React-facing hooks using `useSyncExternalStore`, or convert this module to the already-installed Zustand dependency. The minimal approach is a small local subscription API that preserves existing imperative functions and tests.
6. Update `CartDrawer.tsx` to subscribe to both collections rather than calling snapshot getters during render.
7. Render an active-cart section with both `Remove` and `Save for later` controls.
8. Render a separate saved-items section with a `Move to cart` control.
9. Keep saved items outside active-cart quantities and any future checkout totals.
10. Preserve `clearCart()` as active-cart-only behavior. Add `clearSavedItems()` or a test-oriented `resetCartStore()` so tests can isolate both collections.
11. Expand `tests/cartStore.test.ts` with focused cart behavior tests.
12. Run one-shot tests, build/type-check, and lint.

No API-client change is warranted unless saved items must survive reloads or synchronize across devices.

**Tests**
Add coverage for:
- Saving an active item removes it from the cart and retains its full quantity.
- Moving a saved item restores it to the cart.
- Saving or restoring an unknown product ID is a no-op.
- Saving into an existing saved line merges quantities without duplicates.
- Restoring into an existing cart line merges quantities without duplicates.
- Removing an active item does not remove the corresponding saved item.
- Clearing the active cart does not clear saved items.
- The reset mechanism clears both collections between tests.
- Getters do not expose state that callers can mutate accidentally.

A UI test would also be valuable for button behavior and section rendering, but it requires adding a DOM environment and React testing dependency because none currently exists.

**Risks**
- The current store is non-reactive. Existing add/remove actions do not inherently trigger `CartDrawer` rerenders; adding save behavior without addressing subscriptions would produce stale UI.
- `getCartItems()` currently returns the mutable internal array, allowing external mutation.
- Quantity is mutated in place, which is incompatible with reliable snapshot-based React subscriptions.
- Save/restore collision semantics are unspecified. Merging quantities is the safest non-lossy default.
- Persistence expectations are unspecified. An in-memory implementation disappears on refresh.
- Product prices are copied into cart items; long-lived saved items could carry stale prices if persistence is later added.
- `clearCart()` semantics need to remain explicit so clearing checkout items does not unexpectedly delete saved items.
- The fixture lacks a conventional browser bootstrap and DOM-test setup, so build or UI verification may expose unrelated baseline gaps.
- Using Zustand would be viable, but it is a broader refactor than adding a small subscription layer.

**Safety Exclusions**
- No files were modified.
- `.env` was not read.
- No Bash, task/subagent, network, or external-context tools were used.
- No backend endpoints, authentication, database schema, local-storage persistence, cross-device synchronization, checkout behavior, analytics, or styling redesign are included in the proposed scope.
- `opencode.json` was not inspected because it is unrelated to application cart behavior.
```

### Context Goblin

- Duration: 139000ms
- Tool calls: 20
- context_goblin_status: yes
- context_goblin_refresh: yes
- context_goblin_read: yes
- Input tokens: 8247
- Output tokens: 2479
- Reasoning tokens: 678
- Cache read tokens: 28672
- Total event tokens: 40076
- Cost: 0

Tool counts:

- context_goblin_read: 1
- context_goblin_refresh: 1
- context_goblin_stats: 1
- context_goblin_status: 1
- glob: 1
- grep: 1
- read: 14

Files read:

- package.json
- src/App.tsx
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
- tsconfig.json
- vite.config.ts

Errors:

- none

Final answer:

```txt
**Stack**
- TypeScript with strict mode
- React using JSX transform
- Vite
- Vitest
- Zustand installed but currently unused
- ESLint
- Package manager is unconfirmed because no root lockfile exists

Context Goblin cache was missing and regenerated as requested. It is fresh: 2,598 bytes, 7 tracked files, 13 code-mapped files, and 39 mapped symbols.

**Commands**
Defined in `package.json`:

- Development: `npm run dev`
- Tests: `npm test`
- One test run: `npm test -- --run`
- Build/type-check: `npm run build`
- Lint: `npm run lint`

Using `npm` is provisional because the repository has no root package-manager lockfile.

**Entry Points**
- Application module: `src/main.tsx`
- Root component: `src/App.tsx`
- Catalog/cart composition: `src/routes.tsx`
- Cart UI: `src/features/cart/CartDrawer.tsx`
- Cart state: `src/features/cart/cartStore.ts`
- Product-to-cart action: `src/features/catalog/ProductCard.tsx`

`src/main.tsx` only exports `App`; it does not mount React into the DOM. That existing limitation is separate from the requested feature.

**Recommended Design**
Use the already-installed Zustand dependency to make both cart and saved-item changes reactive.

State shape in `src/features/cart/cartStore.ts`:

```ts
interface CartState {
  items: CartItem[]
  savedItems: CartItem[]
  addToCart(product: Product): void
  removeFromCart(productId: string): void
  saveForLater(productId: string): void
  moveToCart(productId: string): void
  clearCart(): void
}
```

Behavior:

- `saveForLater(id)` moves the complete cart line, including quantity, from `items` to `savedItems`.
- `moveToCart(id)` moves it back.
- If the destination already contains that product, combine quantities instead of creating duplicate lines.
- Unknown product IDs are no-ops.
- Preserve current in-memory-only behavior; do not introduce browser persistence without an explicit requirement.
- Treat “Remove” and “Save for later” as distinct actions.
- Render a separate “Saved for later” section in the drawer with a “Move to cart” action.

**Implementation Plan**
1. Refactor `src/features/cart/cartStore.ts` from mutable module state to a Zustand hook containing active and saved collections.
2. Update `src/features/catalog/ProductCard.tsx` to select and invoke the reactive `addToCart` action.
3. Update `src/features/cart/CartDrawer.tsx` to subscribe to both collections and expose:
   - Remove
   - Save for later
   - Move to cart
   - Empty-state labels for active and saved sections
4. Extend `tests/cartStore.test.ts` to exercise transitions and quantity semantics through `useCartStore.getState()`.
5. Run test, build, and lint commands.

**Files Recommended for Modification**
- `src/features/cart/cartStore.ts`
- `src/features/cart/CartDrawer.tsx`
- `src/features/catalog/ProductCard.tsx`
- `tests/cartStore.test.ts`

No new files are necessary. `src/styles/theme.css` would only need modification if visual styling is included in scope.

**Tests**
Required store tests:

- Saves an item and removes it from the active cart.
- Preserves quantity when saving.
- Moves a saved item back to the cart.
- Combines quantities when moving into an existing destination line.
- Does nothing for unknown IDs.
- Keeps remove behavior scoped to active cart items.
- Resets both collections between tests.
- Existing add/remove behavior remains valid.

UI interaction tests would require adding a React DOM testing dependency; none is currently installed. Avoid that dependency expansion unless component-level testing is explicitly requested.

**Risks**
- The current non-reactive store means the UI does not reliably update after any cart mutation. Merely adding saved-item arrays would preserve this bug.
- `clearCart` semantics need to be explicit. For test isolation, it should probably clear both active and saved items; production naming may instead justify a separate `clearSavedItems`.
- Moving an item where the destination already has the same SKU needs defined quantity behavior; combining quantities is the least surprising choice.
- Saved items will disappear on refresh because existing state is memory-only.
- Broadening this into persistence introduces storage migration, stale product-price, and hydration concerns.
- Current rendering/bootstrap configuration may prevent end-to-end browser verification independently of this feature.

**Exact Files Inspected**
- `package.json`
- `tsconfig.json`
- `vite.config.ts`
- `src/main.tsx`
- `src/App.tsx`
- `src/routes.tsx`
- `src/components/Button.tsx`
- `src/components/Header.tsx`
- `src/styles/theme.css`
- `src/features/cart/cartStore.ts`
- `src/features/cart/CartDrawer.tsx`
- `src/features/catalog/ProductCard.tsx`
- `src/features/catalog/ProductList.tsx`
- `tests/cartStore.test.ts`

A focused cart-symbol search was also performed across TypeScript files. No source files were modified; only the required Context Goblin cache was generated.

**Safety Exclusions**
Not read or searched:

- `.env`
- `.env.*`
- `*.pem`
- `*.key`
- `secrets.json`
- `credentials.json`
- `node_modules/**`
- `.git/**`
- `dist/**`
- `build/**`
- `coverage/**`
- `.next/**`
- `.nuxt/**`
- `.output/**`
- `.opencode/cache/context-goblin/**` except through Context Goblin’s dedicated tools
```
