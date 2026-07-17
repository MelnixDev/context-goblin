# Context Goblin Token Usage A/B Report

Generated: 2026-07-14T09:19:53.989Z
OpenCode version: 1.17.18
Context Goblin version: 0.1.16
Model group: custom

## Task

Measure token usage while planning where and how to add a "Save for later" feature to a realistic React/Vite cart and catalog app. The model must not modify files or read .env.

## Protocol

- Each arm receives a fresh copy of the same synthetic fixture.
- The `task`, `bash`, and `edit` tools are explicitly denied so repository reads remain visible and comparable in the parent OpenCode event stream.
- Models may use direct `read`, `glob`, and `grep` tools; the Context Goblin arm may additionally use Context Goblin tools.
- Results are one run per model and arm. Model behavior and provider token accounting can vary between runs.

## Summary

| Model | Baseline Input | Goblin Input | Input Saved | Input Status | Baseline Total | Goblin Total | Total Saved | Total Status | Baseline Reads | Goblin Reads | File Saved | File Status | Cache Size | Token Result |
| --- | ---: | ---: | ---: | --- | ---: | ---: | ---: | --- | ---: | ---: | ---: | --- | ---: | --- |
| openai/gpt-5.5 | 19815 | 7056 | 64% | pass | 38930 | 45954 | -18% | fail | 16 | 8 | 50% | pass | 2596 | mixed |
| openai/gpt-5.6-sol | 24917 | 7272 | 71% | pass | 148523 | 37747 | 75% | pass | 16 | 9 | 44% | pass | 2596 | pass |

## openai/gpt-5.5

### Summary

- Baseline completed: true
- Context Goblin completed and validated: true
- Tool use OK: true
- Answer OK: true
- Result: mixed
- Baseline direct file reads: 16
- Context Goblin built-in file reads: 8
- File-read reduction: 50%
- File-read status: pass
- Input-token reduction: 64%
- Input-token status: pass
- Total-token reduction: -18%
- Total-token status: fail
- Quality score: 6/6
- Quality hits: cartStore.ts, CartDrawer.tsx, catalog product file, tests, risks, safety exclusions
- Required quality hits: save-for-later feature, cart state, cart UI, cart tests
- Quality disqualifiers: none
- Cache size: 2596 bytes
- Secret leakage: none detected
- Baseline errors: 0
- Context Goblin errors: 0

### Baseline

- Duration: 60000ms
- Tool calls: 23
- Input tokens: 19815
- Output tokens: 2235
- Reasoning tokens: 496
- Cache read tokens: 16384
- Total event tokens: 38930
- Cost: 0

Tool counts:

- glob: 5
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
React + TypeScript + Vite, with Vitest tests. `zustand` is installed but current cart state is a plain module-level array.

**Commands**
No shell commands were run per your constraint.

Relevant project scripts from `package.json`:
- `npm run dev`
- `npm run build`
- `npm test`
- `npm run lint`

**Entry Points**
- App shell: `src/App.tsx`
- Route composition: `src/routes.tsx`
- Catalog UI: `src/features/catalog/ProductList.tsx`
- Product add action: `src/features/catalog/ProductCard.tsx`
- Cart UI: `src/features/cart/CartDrawer.tsx`
- Cart state/actions: `src/features/cart/cartStore.ts`
- Existing tests: `tests/cartStore.test.ts`

**Exact Files Inspected**
- `package.json`
- `README.md`
- `vite.config.ts`
- `tsconfig.json`
- `src/App.tsx`
- `src/main.tsx`
- `src/routes.tsx`
- `src/api/client.ts`
- `src/components/Button.tsx`
- `src/components/Header.tsx`
- `src/styles/theme.css`
- `src/features/catalog/ProductCard.tsx`
- `src/features/catalog/ProductList.tsx`
- `src/features/cart/CartDrawer.tsx`
- `src/features/cart/cartStore.ts`
- `tests/cartStore.test.ts`

**Implementation Plan**
1. Update `src/features/cart/cartStore.ts`.
2. Add a second module-level collection, likely `savedItems: CartItem[]`.
3. Add `getSavedItems()`.
4. Add `saveForLater(productId: string)` that moves an item from `items` to `savedItems`.
5. Add `moveToCart(productId: string)` that moves a saved item back into `items`.
6. Preserve quantity when moving between lists.
7. If moving back to cart and the item already exists there, merge quantities rather than duplicate the row.
8. Update `clearCart()` to clear both cart and saved items, so tests remain isolated.
9. Update `src/features/cart/CartDrawer.tsx`.
10. Import `getSavedItems`, `saveForLater`, and `moveToCart`.
11. Render cart items with both `Remove` and `Save for later` actions.
12. Render a saved-for-later section with `Move to cart` actions.
13. Update `tests/cartStore.test.ts`.
14. Add tests for saving an item, removing it from cart, listing it under saved items, moving it back, and merging quantities when applicable.

**Risks**
- Current cart state is not reactive. `addToCart`, `removeFromCart`, and the proposed save actions mutate module state but do not trigger React re-render by themselves.
- Because the app currently uses direct function calls instead of React state/hooks, the UI may only reflect changes after an unrelated render.
- Converting the cart to Zustand or `useSyncExternalStore` would improve correctness but is a larger change than strictly required.
- `clearCart()` currently clears only cart items; changing it to also clear saved items is desirable for test isolation but slightly broadens semantics.
- Saved item quantity behavior should be confirmed if product requirements differ from preserving quantity.

**Tests**
Recommended verification:
- `npm test`
- `npm run build`
- `npm run lint`

Specific test cases to add:
- Saving an item removes it from `getCartItems()`.
- Saving an item adds it to `getSavedItems()`.
- Moving a saved item back removes it from saved items.
- Moving a saved item back adds or merges it into cart.
- `clearCart()` clears both cart and saved items.

**Safety Exclusions**
- Did not read `.env`.
- Did not modify any files.
- Did not use Context Goblin, task/subagents, or bash.
- Would avoid changing `src/api/client.ts`, `vite.config.ts`, `tsconfig.json`, `opencode.json`, and unrelated components unless a later implementation reveals a direct need.
```

### Context Goblin

- Duration: 65000ms
- Tool calls: 16
- context_goblin_status: yes
- context_goblin_refresh: yes
- context_goblin_read: yes
- Input tokens: 7056
- Output tokens: 1873
- Reasoning tokens: 161
- Cache read tokens: 36864
- Total event tokens: 45954
- Cost: 0

Tool counts:

- context_goblin_read: 1
- context_goblin_refresh: 1
- context_goblin_stats: 1
- context_goblin_status: 1
- glob: 3
- grep: 1
- read: 8

Files read:

- package.json
- src/App.tsx
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
- TypeScript, React, Vite, Node.js.
- State is currently a plain module-level in-memory store in `src/features/cart/cartStore.ts`, not Zustand despite dependency being present.
- Package manager is not identifiable from root lockfiles. No root `package-lock.json`, `yarn.lock`, or `pnpm-lock.yaml` found.

**Commands**
- Dev: `vite`
- Build: `tsc && vite build`
- Test: `vitest`
- Lint: `eslint src --ext ts,tsx`

**Entry Points**
- App entry: `src/main.tsx`
- UI composition: `src/App.tsx`
- Catalog/cart route composition: `src/routes.tsx`
- Cart feature entry: `src/features/cart/CartDrawer.tsx`
- Cart behavior: `src/features/cart/cartStore.ts`

**Files Inspected**
- `package.json`
- `src/features/cart/cartStore.ts`
- `src/features/cart/CartDrawer.tsx`
- `src/features/catalog/ProductCard.tsx`
- `src/features/catalog/ProductList.tsx`
- `src/routes.tsx`
- `src/App.tsx`
- `tests/cartStore.test.ts`

**Files Recommended To Modify**
- `src/features/cart/cartStore.ts`
- `src/features/cart/CartDrawer.tsx`
- `tests/cartStore.test.ts`

**Implementation Plan**
1. Extend `cartStore.ts` with a second in-memory collection for saved items.
2. Add exported functions:
   - `saveForLater(productId: string)` moves a cart item from `items` to saved items.
   - `moveToCart(productId: string)` moves a saved item back to cart.
   - `removeSavedItem(productId: string)` removes from saved items.
   - `getSavedItems()` returns saved items.
3. Keep `CartItem` shape for saved items, preserving `quantity` so moving back to cart can retain quantity or merge quantity with an existing cart item.
4. Update `clearCart()` to clear both cart and saved items, because tests use it as global store reset.
5. Update `CartDrawer.tsx` to render two sections:
   - Current cart items with `Remove` and `Save for later`.
   - Saved-for-later items with `Move to cart` and optional `Remove`.
6. Keep all changes local to cart feature; no route or catalog changes are required.
7. Add cart store tests for:
   - Moving an item from cart to saved list.
   - Moving a saved item back to cart.
   - Removing a saved item.
   - Merging behavior if the same product already exists in cart when moving back.
   - `clearCart()` clearing both collections.

**Behavior Details To Decide**
- Recommended: when moving saved item back to cart and cart already has the same product, add saved quantity to existing cart quantity and remove from saved.
- Recommended: saving an already-saved product should merge quantities rather than duplicate rows.
- Recommended: `getCartItems()` and `getSavedItems()` should return arrays consistently, but existing code returns the live array. A safer change would return copies, though that may be slightly broader.

**Risks**
- Current UI reads module state directly and does not use React state, so button actions may mutate data without triggering a re-render. This already affects remove behavior. A robust feature may require adding local state refresh in `CartDrawer` or moving to Zustand.
- Store is in-memory only; saved-for-later will not persist across refreshes.
- Existing tests only cover store behavior, not rendered UI behavior.
- `clearCart()` currently means cart reset only; expanding it to saved items is best for tests but changes semantics slightly.

**Tests**
- Add tests in `tests/cartStore.test.ts`.
- Run `vitest`.
- Run `tsc && vite build` or package script equivalent.
- Run `eslint src --ext ts,tsx` if ESLint config is functional.

**Safety Exclusions**
- Did not read `.env` or `.env.*`.
- Did not inspect denied secret/build paths.
- Did not modify files.
- Did not use bash, task/subagents, or external discovery beyond Context Goblin plus focused `read`, `glob`, and `grep`.
```

## openai/gpt-5.6-sol

### Summary

- Baseline completed: true
- Context Goblin completed and validated: true
- Tool use OK: true
- Answer OK: true
- Result: pass
- Baseline direct file reads: 16
- Context Goblin built-in file reads: 9
- File-read reduction: 44%
- File-read status: pass
- Input-token reduction: 71%
- Input-token status: pass
- Total-token reduction: 75%
- Total-token status: pass
- Quality score: 6/6
- Quality hits: cartStore.ts, CartDrawer.tsx, catalog product file, tests, risks, safety exclusions
- Required quality hits: save-for-later feature, cart state, cart UI, cart tests
- Quality disqualifiers: none
- Cache size: 2596 bytes
- Secret leakage: none detected
- Baseline errors: 0
- Context Goblin errors: 0

### Baseline

- Duration: 93000ms
- Tool calls: 19
- Input tokens: 24917
- Output tokens: 2597
- Reasoning tokens: 689
- Cache read tokens: 120320
- Total event tokens: 148523
- Cost: 0

Tool counts:

- glob: 1
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
- React with TypeScript and JSX.
- Vite development/build tooling.
- Vitest for unit tests.
- Zustand is installed but currently unused.
- ESLint for `src/**/*.ts(x)`.
- No router library, persistence layer, backend cart API, or component-testing library is evident.

**Commands**
Available from `package.json`:

- `npm run dev` starts Vite.
- `npm run build` runs `tsc && vite build`.
- `npm test` runs Vitest in watch mode.
- `npm run lint` runs ESLint over `src`.

For implementation verification, use:

```sh
npm test -- --run
npm run lint
npm run build
```

No commands were executed because inspection was restricted to `read`, `glob`, and `grep`.

**Entry Points**
- `src/main.tsx`: exports `App`; it does not currently mount React with `createRoot`.
- `src/App.tsx`: renders `Header` and `routes.catalog`.
- `src/routes.tsx`: composes `ProductList` and `CartDrawer`.
- `src/features/catalog/ProductCard.tsx`: calls `addToCart`.
- `src/features/cart/CartDrawer.tsx`: displays cart items and calls `removeFromCart`.
- `src/features/cart/cartStore.ts`: owns all cart state and mutations.

**Current Behavior**
- Cart state is a module-level mutable array.
- `CartDrawer` reads a snapshot through `getCartItems()`.
- Mutations do not notify React, so adding, removing, or saving items would not reliably rerender the UI.
- Duplicate product additions increment quantity.
- No state is persisted.
- Existing tests cover only basic add/remove behavior.

**Implementation Plan**
1. Refactor `src/features/cart/cartStore.ts` into a reactive Zustand store with:
   - `items: CartItem[]`
   - `savedItems: CartItem[]`
   - `addToCart(product)`
   - `removeFromCart(productId)`
   - `saveForLater(productId)`
   - `moveToCart(productId)`
   - `removeSavedItem(productId)`
   - `clearCart()` resetting both collections for deterministic tests
2. Make each transition immutable so Zustand detects updates.
3. Define movement semantics:
   - Saving removes the full cart line and preserves its quantity.
   - Moving back removes the saved line.
   - If the product was independently re-added to the cart, moving it back merges quantities rather than creating duplicate lines.
   - Repeated save operations merge by product ID.
4. Update `src/features/catalog/ProductCard.tsx` to select the reactive `addToCart` action.
5. Update `src/features/cart/CartDrawer.tsx` to:
   - Subscribe to cart and saved-item selectors.
   - Render a “Save for later” action beside each cart line.
   - Render a separate “Saved for later” section.
   - Offer “Move to cart” and “Remove” actions for saved items.
   - Use the existing native-button style unless broader design work is requested.
6. Expand `tests/cartStore.test.ts` around state transitions and reset state in `beforeEach`.
7. Run the focused tests, lint, and build commands above.

**Expected Files Changed**
- `src/features/cart/cartStore.ts`
- `src/features/cart/CartDrawer.tsx`
- `src/features/catalog/ProductCard.tsx`
- `tests/cartStore.test.ts`

No new route or API file should be necessary.

**Tests**
Add cases for:

- Saving moves an item out of the active cart.
- Saved item retains product data and quantity.
- Moving a saved item returns it to the cart.
- Moving back merges quantities when the same product is already active.
- Repeated save operations do not create duplicate saved rows.
- Removing a saved item affects only `savedItems`.
- Removing an active item does not affect its saved counterpart.
- Unknown product IDs are safe no-ops.
- `clearCart` resets active and saved collections.
- Existing add/remove and quantity-increment behavior remains intact.

A DOM interaction test would also be valuable, but the repository currently lacks React Testing Library, jsdom configuration, and a browser mount entry. Adding that infrastructure solely for this feature would be disproportionate unless UI tests are explicitly required.

**Risks**
- The largest existing defect is non-reactive state; adding saved state without correcting it would produce stale UI.
- Whether saved quantities should be preserved or reset to one is a product decision. The plan preserves quantity to avoid silent data loss.
- There is no persistence, so both cart and saved items disappear on reload.
- There is no authenticated user or backend synchronization.
- Product IDs are assumed globally unique.
- `clearCart` currently means active cart only by name; changing it to clear saved items too may need explicit confirmation if saved items later become persistent.
- The application currently exports `App` without mounting it, so browser-level verification may depend on external fixture infrastructure not present here.
- Using Zustand changes the store’s internal API. All known consumers are local and can be migrated together.

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

Repository-wide focused searches were also performed for cart references, Zustand usage, rendering setup, CSS imports, and Vitest configuration.

**Safety Exclusions**
- No files were modified.
- `.env` was discovered by filename but not read or searched.
- No Context Goblin tools, task/subagents, shell, or Bash commands were used.
- No dependency installation, network access, test execution, build, lint, persistence, API changes, checkout flow changes, or unrelated refactoring was performed.
- `opencode.json` was not read because it is unrelated to the cart feature.
```

### Context Goblin

- Duration: 68000ms
- Tool calls: 14
- context_goblin_status: yes
- context_goblin_refresh: yes
- context_goblin_read: yes
- Input tokens: 7272
- Output tokens: 2066
- Reasoning tokens: 761
- Cache read tokens: 27648
- Total event tokens: 37747
- Cost: 0

Tool counts:

- context_goblin_read: 1
- context_goblin_refresh: 1
- context_goblin_stats: 1
- context_goblin_status: 1
- glob: 1
- read: 9

Files read:

- package.json
- src/App.tsx
- src/components/Button.tsx
- src/features/cart/CartDrawer.tsx
- src/features/cart/cartStore.ts
- src/features/catalog/ProductCard.tsx
- src/main.tsx
- src/routes.tsx
- tests/cartStore.test.ts

Errors:

- none

Final answer:

```txt
**Stack**
- TypeScript, React, Vite, Node.js
- Vitest for tests
- ESLint for linting
- Zustand is installed but currently unused
- Package manager is undetermined: no root lockfile exists

**Commands**
- Development: `npm run dev` → `vite`
- Build/type-check: `npm run build` → `tsc && vite build`
- Tests: `npm test` → `vitest`
- Non-watch tests: `npm test -- --run`
- Lint: `npm run lint` → `eslint src --ext ts,tsx`

The `npm` prefix is illustrative because the repository does not identify a package manager.

**Entry Points**
- `src/main.tsx:1` exports `App`; it does not mount React itself.
- `src/App.tsx:3` renders the header and catalog route.
- `src/routes.tsx:3` composes `ProductList` and `CartDrawer`.
- `src/features/cart/CartDrawer.tsx:2` is the cart UI entry point.
- `src/features/cart/cartStore.ts:3` owns in-memory cart state.
- `src/features/catalog/ProductCard.tsx:3` initiates cart additions.

**Current Behavior**
- Cart state is a module-level array, not Zustand state.
- Items are unique by product ID, with repeated additions increasing quantity.
- Removing an item deletes the entire line.
- `CartDrawer` reads state directly, so cart mutations do not trigger a React render by themselves.
- State is memory-only and disappears on reload.
- No saved-item model, persistence, backend API, or UI test framework exists.

**Recommended Files**
- Modify `src/features/cart/cartStore.ts`
- Modify `src/features/cart/CartDrawer.tsx`
- Modify `tests/cartStore.test.ts`
- Potentially modify `src/features/catalog/ProductCard.tsx` only if adding a product already saved should move it back into the active cart
- No new file is required for the minimal implementation

**Implementation Plan**
1. Convert `cartStore.ts` to reactive Zustand state, since Zustand is already installed.
2. Store two collections:
   - `items: CartItem[]`
   - `savedItems: CartItem[]`
3. Add atomic actions:
   - `saveForLater(productId)` transfers the full cart line, including quantity, to saved items.
   - `moveToCart(productId)` transfers the full saved line back and merges quantities if the product is already active.
   - Existing `addToCart`, `removeFromCart`, and `clearCart` behavior remains available.
4. Enforce unique product IDs within each collection.
5. Make the active and saved collections mutually exclusive after transfer operations.
6. Update `CartDrawer` to subscribe to store selectors so mutations rerender the UI.
7. Render a “Save for later” action beside each active line.
8. Add a “Saved for later” section with a “Move to cart” action and a clear empty state or omit the section when empty.
9. Preserve the existing plain-button visual approach unless broader styling is requested.
10. Keep persistence out of scope unless saved products must survive reloads or sessions.

**Tests**
Add focused store tests in `tests/cartStore.test.ts` for:

- Saving removes the line from the active cart.
- Saving preserves product data and quantity.
- Moving restores the saved line to the cart.
- Moving merges quantities when an active line with the same ID exists.
- Unknown IDs are no-ops.
- Repeated transfers do not create duplicate IDs.
- Test reset clears both active and saved collections.
- Existing add/remove behavior remains unchanged.

A component interaction test would also be valuable, but the repository has no React DOM testing dependency or setup. Adding that infrastructure solely for this feature may be disproportionate; at minimum, run build/type-check and store tests.

**Risks**
- Reactive store conversion changes the store API and must preserve direct action access used by `ProductCard` and existing tests.
- Product types are defined in `ProductCard.tsx`, creating feature-layer coupling and a type-only circular relationship with the cart store. It currently compiles away, but a shared product model would be cleaner if the domain expands.
- Desired quantity semantics need confirmation. This plan transfers the entire cart line rather than one unit.
- Whether direct “Add” of an already-saved product should remove it from saved items is a product decision.
- No persistence means “Save for later” lasts only for the current page lifetime.
- `src/main.tsx` does not mount an application, suggesting this may be a fixture or externally hosted entry point.
- UI accessibility should distinguish active-cart and saved-item sections and use explicit action labels.

**Files Inspected**
- Context Goblin generated project cache
- `package.json`
- `src/main.tsx`
- `src/App.tsx`
- `src/routes.tsx`
- `src/components/Button.tsx`
- `src/features/catalog/ProductCard.tsx`
- `src/features/cart/cartStore.ts`
- `src/features/cart/CartDrawer.tsx`
- `tests/cartStore.test.ts`

**Safety Exclusions**
Not read or recommended for modification:

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

No files were modified and no commands or tests were executed.
```

