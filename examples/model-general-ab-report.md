# General Model Context Goblin A/B Report

Generated: 2026-07-14T09:19:53.903Z
OpenCode version: 1.17.18
Context Goblin version: 0.1.15
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
| openai/gpt-5.5 | yes | yes | yes | 15 | 8 | 47% | 58% | 6/6 | 2596 | pass | pass |
| openai/gpt-5.6-sol | yes | yes | yes | 17 | 14 | 18% | -2% | 6/6 | 2596 | pass | pass |

## openai/gpt-5.5

### Summary

- Baseline completed: true
- Context Goblin completed and validated: true
- Tool use OK: true
- Answer OK: true
- Result: pass
- Baseline direct file reads: 15
- Context Goblin built-in file reads: 8
- File-read reduction: 47%
- File-read status: pass
- Input-token reduction: 58%
- Input-token status: pass
- Total-token reduction: 6%
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

- Duration: 59000ms
- Tool calls: 21
- Input tokens: 14851
- Output tokens: 2119
- Reasoning tokens: 300
- Cache read tokens: 21504
- Total event tokens: 38774
- Cost: 0

Tool counts:

- glob: 4
- grep: 2
- read: 15

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
- tests/cartStore.test.ts
- tsconfig.json
- vite.config.ts

Errors:

- none

Final answer:

```txt
**Stack**
React + TypeScript + Vite + Vitest. `zustand` is installed but current cart state is simple module-level state in `cartStore.ts`.

**Available Commands**
From `package.json`:

- `npm run dev`: Vite dev server
- `npm run build`: `tsc && vite build`
- `npm test`: Vitest
- `npm run lint`: ESLint over `src`

**Entry Points**
- App composition: `src/App.tsx`
- Route composition: `src/routes.tsx`
- Catalog add-to-cart UI: `src/features/catalog/ProductCard.tsx`
- Cart UI: `src/features/cart/CartDrawer.tsx`
- Cart state/actions: `src/features/cart/cartStore.ts`
- Existing cart tests: `tests/cartStore.test.ts`

**Exact Files Inspected**
- `package.json`
- `README.md`
- `tsconfig.json`
- `vite.config.ts`
- `src/App.tsx`
- `src/main.tsx`
- `src/routes.tsx`
- `src/api/client.ts`
- `src/components/Button.tsx`
- `src/components/Header.tsx`
- `src/features/catalog/ProductCard.tsx`
- `src/features/catalog/ProductList.tsx`
- `src/features/cart/cartStore.ts`
- `src/features/cart/CartDrawer.tsx`
- `tests/cartStore.test.ts`

**Searches Performed**
- File discovery with `glob("**/*")`
- Package discovery with `glob("**/package.json")`
- Cart file discovery with `glob("**/*cart*")`
- Test discovery with `glob("tests/**/*")`
- Cart references with `grep("cart|Cart|basket|Basket")`
- Existing save/wishlist concepts with `grep("save for later|Save for later|saved|Saved|wishlist|Wishlist|later")`

No existing save-for-later or wishlist implementation was found.

**Implementation Plan**
1. Extend `src/features/cart/cartStore.ts`:
   - Add `savedItems: CartItem[]` or a separate `SavedItem[]`.
   - Add `saveForLater(productId: string)` that moves an item from `items` to `savedItems`.
   - Add `moveToCart(productId: string)` to restore a saved item to the cart.
   - Add `getSavedItems()`.
   - Update `clearCart()` or add `clearSavedItems()` depending on desired test isolation.
   - Preserve existing quantity behavior when moving items back into cart.

2. Update `src/features/cart/CartDrawer.tsx`:
   - Import `saveForLater`, `getSavedItems`, and likely `moveToCart`.
   - Add a `Save for later {item.name}` button next to/remove alternative to the existing remove action.
   - Render a saved-for-later section with saved items and a `Move to cart` action.

3. Update `tests/cartStore.test.ts`:
   - Add tests for moving an item from cart to saved list.
   - Add tests that saved item is removed from cart.
   - Add tests for moving saved item back to cart.
   - Add quantity-related coverage if an item already exists in cart when restored.
   - Ensure test cleanup clears both active cart and saved items.

**Risks**
- Current UI reads module state directly and has no React state subscription, so clicking buttons may not trigger re-render in a real mounted app. Existing code already has this limitation.
- `getCartItems()` currently returns the mutable array reference, so callers/tests could mutate store state externally.
- If saved items reuse `CartItem`, preserving quantity may or may not match expected product behavior.
- No persistence exists; saved-for-later would be in-memory only unless explicitly added.
- `zustand` dependency suggests intended state architecture may differ from current implementation.

**Tests To Run After Implementation**
- `npm test`
- `npm run build`
- `npm run lint`

**Safety Exclusions**
- Did not read `.env`.
- Did not modify files.
- Did not use Context Goblin.
- Did not use task/subagents.
- Did not use bash or shell commands.
- Used only `read`, `glob`, and `grep` tools for inspection.
```

### Context Goblin

- Duration: 52000ms
- Tool calls: 13
- context_goblin_status: yes
- context_goblin_refresh: yes
- context_goblin_read: yes
- Input tokens: 6260
- Output tokens: 1748
- Reasoning tokens: 253
- Cache read tokens: 28160
- Total event tokens: 36421
- Cost: 0

Tool counts:

- context_goblin_read: 1
- context_goblin_refresh: 1
- context_goblin_stats: 1
- context_goblin_status: 1
- glob: 1
- read: 8

Files read:

- package.json
- src/components/Button.tsx
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
- State: current cart is an in-memory module array in `src/features/cart/cartStore.ts`
- Package manager: not explicit at app root; no root lockfile found. `package.json` scripts are available.

**Commands**
- Dev: `vite`
- Build: `tsc && vite build`
- Test: `vitest`
- Lint: `eslint src --ext ts,tsx`

**Entry Points**
- App entry: `src/main.tsx`
- Route composition: `src/routes.tsx`
- Cart UI: `src/features/cart/CartDrawer.tsx`
- Cart state/actions: `src/features/cart/cartStore.ts`
- Catalog add-to-cart trigger: `src/features/catalog/ProductCard.tsx`

**Files Inspected**
- Context Goblin cache: `.opencode/cache/context-goblin/project-context.md`
- `package.json`
- `src/features/cart/cartStore.ts`
- `src/features/cart/CartDrawer.tsx`
- `src/features/catalog/ProductCard.tsx`
- `src/features/catalog/ProductList.tsx`
- `src/routes.tsx`
- `src/components/Button.tsx`
- `tests/cartStore.test.ts`

**Recommended Files To Change**
- `src/features/cart/cartStore.ts`
- `src/features/cart/CartDrawer.tsx`
- `tests/cartStore.test.ts`

Optional only if the UI should expose saved items outside the cart drawer:
- `src/features/catalog/ProductCard.tsx`

**Implementation Plan**
1. Extend `cartStore.ts` with a saved-for-later collection:
   - Add `let savedItems: Product[] = []`
   - Add `saveForLater(productId: string)` to move an item from `items` to `savedItems`
   - Add `moveToCart(productId: string)` to move a saved product back into cart using existing `addToCart`
   - Add `removeSavedItem(productId: string)`
   - Add `getSavedItems()`
   - Update `clearCart()` to clear both `items` and `savedItems` for test isolation

2. Preserve existing cart behavior:
   - `addToCart` should keep incrementing quantity for existing cart items
   - `removeFromCart` should continue removing only from active cart
   - Avoid persistence unless explicitly required

3. Update `CartDrawer.tsx`:
   - Import `getSavedItems`, `saveForLater`, `moveToCart`, and possibly `removeSavedItem`
   - Render cart items with both `Remove` and `Save for later`
   - Render saved items in a separate section with `Move to cart`
   - Keep markup simple because existing components are minimal

4. Add tests in `tests/cartStore.test.ts`:
   - Saving an item removes it from cart
   - Saved item appears in saved list
   - Moving saved item back restores it to cart
   - Removing from cart does not affect saved list
   - `clearCart()` clears saved items too

**Risks**
- The current store is not reactive. `CartDrawer` calls plain getter functions, so UI updates may not re-render after mutations unless a parent re-renders. This already affects add/remove cart behavior.
- `zustand` is installed but not currently used. A fully reactive save-for-later feature would likely require converting `cartStore.ts` to a hook/store, but that is a larger change.
- In-memory state means saved-for-later items disappear on refresh.
- Product data is imported from `ProductCard.tsx`, which couples state types to a UI file. Acceptable for minimal change, but not ideal long-term.

**Tests**
- Add unit tests to `tests/cartStore.test.ts`
- Run `vitest`
- Run `tsc && vite build`
- Run `eslint src --ext ts,tsx`

**Safety Exclusions**
- Did not read `.env` or secret-looking files.
- Did not modify files.
- Avoided denied paths from the cache:
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
  - `.opencode/cache/context-goblin/**` except through Context Goblin tools.
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
- Input-token reduction: -2%
- Input-token status: fail
- Total-token reduction: -30%
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

- Duration: 80000ms
- Tool calls: 26
- Input tokens: 13263
- Output tokens: 2832
- Reasoning tokens: 949
- Cache read tokens: 25600
- Total event tokens: 42644
- Cost: 0

Tool counts:

- glob: 6
- grep: 3
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
- React + TypeScript
- Vite
- Zustand available but currently unused
- Vitest for unit tests
- ESLint
- No router library, persistence layer, backend cart API, DOM testing library, or established package-manager lockfile

**Current Flow**
- `src/main.tsx` exports `App`.
- `src/App.tsx` renders `Header` and `routes.catalog`.
- `src/routes.tsx` mounts `ProductList` and `CartDrawer`.
- `ProductCard` calls `addToCart`.
- `cartStore.ts` holds cart items in a module-level mutable array.
- `CartDrawer` reads that array during render and removes items.
- Cart mutations do not notify React, so the drawer does not reliably rerender after add/remove operations.

**Implementation Plan**
1. Update `src/features/cart/cartStore.ts`.
   - Introduce reactive Zustand state with `items` and `savedItems`.
   - Preserve named imperative exports where useful to minimize consumer churn.
   - Implement immutable operations:
     - `saveForLater(productId)` transfers the complete cart line, including quantity, to saved items.
     - `moveToCart(productId)` transfers it back.
     - Merge quantities if the destination already contains the same product.
     - Treat unknown IDs as no-ops.
     - Keep `removeFromCart` scoped to active cart items.
     - Add `removeSavedItem` and a saved-items reset operation if the UI needs deletion and tests need isolation.
   - Keep saved items excluded from cart totals and checkout data.
   - Do not add persistence unless product requirements explicitly call for saved items to survive reloads.

2. Update `src/features/cart/CartDrawer.tsx`.
   - Subscribe to active and saved collections through Zustand selectors.
   - Render separate “Cart” and “Saved for later” sections.
   - Add “Save for later” beside each active item.
   - Add “Move to cart” and optionally “Remove” beside each saved item.
   - Include headings and explicit empty states so the sections remain understandable and accessible.
   - Use stable product IDs as keys.

3. Keep `src/features/catalog/ProductCard.tsx` largely unchanged.
   - Its existing `addToCart(product)` call can remain if the store continues exposing an imperative wrapper.
   - Alternatively, use the Zustand action directly, but that creates unnecessary component churn.

4. Expand `tests/cartStore.test.ts`.
   - Verify saving removes the line from the active cart.
   - Verify quantity and product data are preserved.
   - Verify repeated transfers merge quantities rather than duplicate IDs.
   - Verify moving back merges with an existing active line.
   - Verify unknown IDs are no-ops.
   - Verify removal and clearing semantics for active versus saved items.
   - Reset both collections in `beforeEach`.

No new production file is required for the smallest correct implementation.

**Primary Files**
- `src/features/cart/cartStore.ts`
- `src/features/cart/CartDrawer.tsx`
- `tests/cartStore.test.ts`
- Possibly `src/features/catalog/ProductCard.tsx`, only if the public store API changes

**Entry Points**
- `src/main.tsx:1`
- `src/App.tsx:3`
- `src/routes.tsx:3`
- `src/features/catalog/ProductCard.tsx:3`
- `src/features/cart/CartDrawer.tsx:2`
- `src/features/cart/cartStore.ts:4`

**Commands**
From `package.json`:

```sh
npm run dev
npm run build
npm test -- --run
npm run lint
```

Useful focused verification:

```sh
npm test -- --run tests/cartStore.test.ts
```

These commands were identified but not executed because the requested tool set excluded shell execution.

**Risks**
- The current nonreactive store must be corrected; merely adding another array would leave stale UI behavior.
- “Save for later” persistence is unspecified. Local storage or API synchronization should not be assumed.
- Quantity semantics need to transfer the entire cart line, not decrement one unit, unless requirements say otherwise.
- `clearCart` semantics are ambiguous: it should normally clear only active checkout items, while tests need a separate full reset.
- `Product` is defined in a React component and imported into the store, creating domain-to-UI coupling. Moving it would be cleaner but is unnecessary scope expansion.
- There is no React DOM test infrastructure, `jsdom`, or Testing Library dependency. Store behavior can be fully unit-tested, but UI interaction tests would require added tooling.
- No lockfile exists, and dependencies use `"latest"`, so installs and CI behavior are not reproducible.
- No `index.html`, React root mounting call, ESLint configuration, or imported stylesheet was found; build, runtime, and lint commands may already have unrelated baseline failures.

**Exact Files Inspected**
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
- `src/features/cart/cartStore.ts`
- `src/features/cart/CartDrawer.tsx`
- `src/features/catalog/ProductCard.tsx`
- `src/features/catalog/ProductList.tsx`
- `tests/cartStore.test.ts`

**Safety Exclusions**
- Did not read `.env`.
- Did not inspect or alter secrets.
- Did not read `opencode.json` because it is unrelated to the application feature.
- Did not modify any file.
- Did not run commands, tests, builds, installs, or network requests.
- Did not inspect generated/vendor directories.
- Did not propose checkout, pricing, API, authentication, or persistence changes beyond the requested cart behavior.
```

### Context Goblin

- Duration: 112000ms
- Tool calls: 22
- context_goblin_status: yes
- context_goblin_refresh: yes
- context_goblin_read: yes
- Input tokens: 13528
- Output tokens: 2696
- Reasoning tokens: 1903
- Cache read tokens: 37376
- Total event tokens: 55503
- Cost: 0

Tool counts:

- context_goblin_read: 1
- context_goblin_refresh: 1
- context_goblin_stats: 1
- context_goblin_status: 1
- glob: 4
- read: 14

Files read:

- README.md
- package.json
- src/App.tsx
- src/components/Button.tsx
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
**Context Goblin**
- Cache was missing and refreshed before inspection.
- Status: fresh, 2,596 bytes, 128 lines.
- Coverage: 7 tracked files, 13 code-mapped files, 39 code-map entries.
- The cache was used to restrict reads to cart behavior, integration points, and configuration.

**Stack**
- TypeScript with strict mode and React JSX.
- React and React DOM.
- Vite.
- Zustand is installed but currently unused.
- Vitest for tests.
- ESLint for `src/**/*.ts(x)`.
- Package manager is unspecified: no root lockfile or `packageManager` field was found.

**Commands**
Defined scripts:

- Development: `npm run dev` (`vite`)
- Build/type-check: `npm run build` (`tsc && vite build`)
- Tests: `npm test` (`vitest`)
- One-shot cart tests: `npm test -- --run tests/cartStore.test.ts`
- One-shot full tests: `npm test -- --run`
- Lint: `npm run lint` (`eslint src --ext ts,tsx`)

The `npm` prefix is provisional because the repository does not identify a package manager.

**Entry Points**
- `src/main.tsx:1` exports `App`, but does not mount it with `createRoot`.
- `src/App.tsx:3` renders `Header` and the catalog route.
- `src/routes.tsx:3` composes `ProductList` and `CartDrawer`.
- `src/features/catalog/ProductCard.tsx:3` adds products to the cart.
- `src/features/cart/CartDrawer.tsx:2` renders current cart items.
- `src/features/cart/cartStore.ts:3` owns module-level cart state.

**Recommended Files**
Files that should change:

- `src/features/cart/cartStore.ts`
- `src/features/cart/CartDrawer.tsx`
- `src/features/catalog/ProductCard.tsx`
- `tests/cartStore.test.ts`

No new file is necessary for the minimal implementation.

**Implementation Plan**
1. Replace the non-reactive module array in `cartStore.ts` with a small Zustand store, using the dependency already declared in `package.json`.
2. Store two collections:
   - `items: CartItem[]`
   - `savedItems: CartItem[]`
3. Add actions:
   - `addToCart(product)`
   - `removeFromCart(productId)`
   - `saveForLater(productId)`
   - `moveToCart(productId)`
   - `removeSavedItem(productId)`
   - `clearCart()`
   - `clearSavedItems()`
4. Make transitions immutable so React subscribers receive updates.
5. Have `saveForLater` atomically remove the complete cart line and add it to saved items, preserving quantity.
6. Have `moveToCart` perform the inverse operation. If the destination already contains the product, merge quantities rather than creating duplicate lines.
7. Update `ProductCard.tsx` to obtain `addToCart` from the Zustand store.
8. Update `CartDrawer.tsx` to subscribe to both collections and render:
   - Active cart items with `Remove` and `Save for later`.
   - A “Saved for later” section with `Move to cart` and `Remove`.
   - Appropriate empty states.
9. Preserve accessible native buttons and include the product name in action labels.
10. Extend `cartStore.test.ts` rather than creating a second store test file, per the project instruction to test cart behavior changes.
11. Verify with the focused test, full test suite, build, and lint commands.

**Behavior Decisions**
- “Save for later” should move, not copy, an item.
- Quantity should be preserved.
- Moving into a collection containing the same product should merge quantities.
- `clearCart` should clear only the active cart; saved items need a separate clearing action.
- Persistence should remain session-only for the minimal feature because the existing cart is in-memory and there is no cart API or persistence layer.

**Tests**
Add coverage for:

- Moving an active cart item into saved items.
- Preserving product fields and quantity.
- Moving a saved item back into the cart.
- Merging quantities when the destination already contains the same SKU.
- No-op behavior for unknown product IDs.
- Removing a saved item.
- Clearing active items without clearing saved items.
- Resetting both collections in `beforeEach` to prevent test leakage.
- Existing add/remove behavior after the state refactor.

Component interaction tests would require adding a React testing dependency that is not currently present. Store-level tests are the smallest justified scope.

**Risks**
- The current cart is not reactive. Merely adding functions to the existing array would not reliably update `CartDrawer`; the state subscription refactor is necessary.
- The current application entry file exports `App` but does not visibly mount it. This synthetic fixture may not run as a normal browser application without additional bootstrapping.
- “Later” can imply persistence across reloads or accounts. This plan intentionally does not introduce `localStorage` or backend behavior.
- Product behavior is undefined when a user adds a catalog product that is already saved. The recommended behavior allows both collections temporarily and merges quantities when explicitly moved.
- Zustand is versioned as `latest`, which can make API behavior less reproducible without a lockfile.
- There are no component test utilities, so UI rendering and click wiring would initially be covered only by build/type-check plus store tests.

**Inspected**
Directly read:

- `package.json`
- `README.md`
- `tsconfig.json`
- `vite.config.ts`
- `src/main.tsx`
- `src/App.tsx`
- `src/routes.tsx`
- `src/components/Button.tsx`
- `src/features/catalog/ProductCard.tsx`
- `src/features/catalog/ProductList.tsx`
- `src/features/cart/cartStore.ts`
- `src/features/cart/CartDrawer.tsx`
- `src/styles/theme.css`
- `tests/cartStore.test.ts`

Also checked only the root names `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, and `bun.lock*`; none exist.

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
- Framework output directories
- `.opencode/cache/context-goblin/**`

No files were modified and no commands were executed.
```

