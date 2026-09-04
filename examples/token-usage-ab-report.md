# Context Goblin Token Usage A/B Report

Generated: 2026-09-01T08:01:07.560Z
OpenCode version: 1.18.20
Context Goblin version: 0.1.19
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
| openai/gpt-5.5 | 10290 | 15661 | -52% | fail | 37406 | 35282 | 6% | pass | 15 | 8 | 47% | pass | 2598 | mixed |
| openai/gpt-5.6-sol | 16143 | 16142 | 0% | pass | 33956 | 39715 | -17% | fail | 17 | 13 | 24% | pass | 2598 | mixed |

## openai/gpt-5.5

### Summary

- Baseline completed: true
- Context Goblin completed and validated: true
- Tool use OK: true
- Answer OK: true
- Result: mixed
- Baseline direct file reads: 15
- Context Goblin built-in file reads: 8
- File-read reduction: 47%
- File-read status: pass
- Input-token reduction: -52%
- Input-token status: fail
- Total-token reduction: 6%
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

- Duration: 62000ms
- Tool calls: 19
- Input tokens: 10290
- Output tokens: 2376
- Reasoning tokens: 164
- Cache read tokens: 24576
- Total event tokens: 37406
- Cost: 0

Tool counts:

- glob: 1
- grep: 3
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
- React + TypeScript + Vite
- Vitest for tests
- `zustand` is installed but not currently used
- Cart state is a module-level in-memory array in `src/features/cart/cartStore.ts`

**Commands / Tool Use**
- Used `glob` with `**/*` to inspect repository shape.
- Used `grep` for `cart|Cart|basket|Basket`.
- Used `grep` for `save for later|saved|wishlist|Wish|later`.
- Used `grep` for `localStorage|sessionStorage|zustand|create\(`.
- Used `read` only on focused source, test, and config files.
- Did not run shell commands.
- Did not modify files.

**Entry Points**
- App entry/export: `src/main.tsx`
- App composition: `src/App.tsx`
- Catalog/cart route composition: `src/routes.tsx`
- Add-to-cart UI: `src/features/catalog/ProductCard.tsx`
- Cart UI: `src/features/cart/CartDrawer.tsx`
- Cart behavior/state: `src/features/cart/cartStore.ts`
- Cart tests: `tests/cartStore.test.ts`

**Exact Files Inspected**
- `package.json`
- `README.md`
- `tsconfig.json`
- `vite.config.ts`
- `src/main.tsx`
- `src/App.tsx`
- `src/routes.tsx`
- `src/components/Header.tsx`
- `src/components/Button.tsx`
- `src/api/client.ts`
- `src/features/cart/cartStore.ts`
- `src/features/cart/CartDrawer.tsx`
- `src/features/catalog/ProductCard.tsx`
- `src/features/catalog/ProductList.tsx`
- `tests/cartStore.test.ts`

**Current Cart Design**
- `cartStore.ts` owns all cart behavior:
  - `items: CartItem[]`
  - `addToCart(product)`
  - `removeFromCart(productId)`
  - `getCartItems()`
  - `clearCart()`
- `CartDrawer.tsx` renders current cart items and removes items.
- There is no existing saved/wishlist/save-for-later concept.
- State is not reactive by itself; the current app calls module functions directly from render/event handlers.

**Implementation Plan**
1. Extend `src/features/cart/cartStore.ts` with a saved-for-later collection:
   - Add `let savedItems: Product[] = []` or a `SavedItem` type if quantity is needed.
   - Add `saveForLater(productId: string)` that finds an item in `items`, removes it from cart, and adds it to saved items.
   - Add `moveToCart(productId: string)` that finds a saved item, removes it from saved items, and calls `addToCart`.
   - Add `removeSavedItem(productId: string)` if saved items need independent removal.
   - Add `getSavedItems()`.
   - Update `clearCart()` to also clear saved items, or add `clearSavedItems()` depending on intended test isolation.
2. Update `src/features/cart/CartDrawer.tsx`:
   - Import `getSavedItems`, `saveForLater`, and optionally `moveToCart`.
   - Add a “Save for later” button next to each cart item.
   - Render a saved-for-later section below cart items.
   - Add “Move to cart” button for saved items.
3. Update `tests/cartStore.test.ts`:
   - Test saving an item removes it from cart.
   - Test saved item appears in `getSavedItems()`.
   - Test moving a saved item back to cart removes it from saved items and restores it to cart.
   - Test duplicate save behavior, likely no duplicate saved rows.
4. Optionally add UI tests later if the project gains a React test setup. Current tests are store-only.

**Suggested Cart Store Behavior**
- If saving a cart item with quantity > 1, choose one clear behavior:
  - Preferred minimal behavior: save the whole `CartItem` including quantity.
  - Alternative: save one unit and decrement cart quantity.
- Given existing `removeFromCart(productId)` removes the whole line item, saving the whole cart line is most consistent.

**Risks**
- Current state is module-level and not reactive; UI may not re-render after clicking cart actions unless some parent render occurs. This already affects remove/add behavior and will also affect save-for-later.
- `getCartItems()` returns the mutable array directly, so callers/tests can mutate store state accidentally.
- `clearCart()` currently clears only cart items. If tests add saved state, test isolation needs either `clearCart()` to clear all cart-related state or a separate `clearSavedItems()`.
- `Product` type is defined in `ProductCard.tsx`, which couples store types to a UI component file. Save-for-later work could keep this for minimal change, but longer-term it should move to a catalog model/type file.
- No persistence exists. Saved-for-later will be in-memory only unless local/session storage or backend support is added.
- `zustand` is installed but unused. Rewriting store architecture would be larger than necessary for this feature.

**Tests**
- Existing command from `package.json`: `npm test`
- Build command from `package.json`: `npm run build`
- Recommended additions in `tests/cartStore.test.ts`:
  - `saves cart item for later`
  - `moves saved item back to cart`
  - `does not duplicate saved item when saving same product twice`
  - `clearCart resets saved items too` if `clearCart()` is expanded

**Safety Exclusions**
- Did not read `.env`.
- Did not modify files.
- Did not use bash or shell commands.
- Did not use task/subagents.
- Did not inspect unrelated hidden files beyond `glob` listing.
```

### Context Goblin

- Duration: 54000ms
- Tool calls: 11
- context_goblin_status: yes
- context_goblin_refresh: yes
- context_goblin_read: yes
- Input tokens: 15661
- Output tokens: 1772
- Reasoning tokens: 441
- Cache read tokens: 17408
- Total event tokens: 35282
- Cost: 0

Tool counts:

- context_goblin_read: 1
- context_goblin_refresh: 1
- context_goblin_status: 1
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
- TypeScript, React, Vite, Node.js
- Package scripts in `package.json`
- Zustand is already installed but not currently used by cart code

**Commands**
- Dev: `npm run dev`
- Build: `npm run build`
- Test: `npm run test`
- Lint: `npm run lint`

**Entry Points**
- App entry: `src/main.tsx`
- App shell: `src/App.tsx`
- Route composition: `src/routes.tsx`
- Cart UI: `src/features/cart/CartDrawer.tsx`
- Cart state: `src/features/cart/cartStore.ts`
- Catalog add-to-cart flow: `src/features/catalog/ProductCard.tsx`

**Files Inspected**
- `package.json`
- `src/App.tsx`
- `src/routes.tsx`
- `src/features/cart/cartStore.ts`
- `src/features/cart/CartDrawer.tsx`
- `src/features/catalog/ProductCard.tsx`
- `src/features/catalog/ProductList.tsx`
- `tests/cartStore.test.ts`

**Recommended Files To Change**
- `src/features/cart/cartStore.ts`
- `src/features/cart/CartDrawer.tsx`
- `tests/cartStore.test.ts`

Optional if UI composition grows:
- `src/features/cart/SavedForLaterList.tsx`

**Current Cart Shape**
- `cartStore.ts` uses module-level mutable state: `let items: CartItem[] = []`
- Existing exports:
  - `addToCart(product)`
  - `removeFromCart(productId)`
  - `getCartItems()`
  - `clearCart()`
- `CartDrawer` calls `getCartItems()` directly during render and removes items with `removeFromCart(item.id)`
- There is no reactive store subscription, so cart UI updates depend on unrelated React re-renders

**Implementation Plan**
1. Replace the module-level cart array with a reactive cart store.
   - Since `zustand` is already a dependency, use it for `items`, `savedItems`, and actions.
   - Keep the implementation small and local to `src/features/cart/cartStore.ts`.

2. Add saved-for-later state.
   - Add `savedItems: CartItem[]`.
   - Add `saveForLater(productId: string)`.
   - Add `moveSavedToCart(productId: string)`.
   - Add `removeSavedItem(productId: string)`.
   - Update `clearCart()` to clear both cart and saved items, or add a separate `clearSavedItems()` if tests need isolated behavior.

3. Define movement semantics.
   - `saveForLater(id)` moves the full cart line item, including `quantity`, from `items` to `savedItems`.
   - If the item already exists in `savedItems`, merge quantities instead of duplicating rows.
   - `moveSavedToCart(id)` moves the saved item back into cart and merges quantity with any existing cart item.

4. Update `CartDrawer.tsx`.
   - Subscribe to cart state instead of calling `getCartItems()` directly.
   - Render cart items with:
     - Remove button
     - Save for later button
   - Render saved items below the cart with:
     - Move to cart button
     - Remove saved item button

5. Preserve existing behavior.
   - `addToCart` should still increment quantity for existing cart items.
   - `removeFromCart` should still remove the whole cart line item.
   - Existing tests should continue to pass after imports are updated if needed.

6. Add cart behavior tests.
   - Saving an item removes it from cart and adds it to saved items.
   - Saving the same item twice merges quantity in saved items.
   - Moving saved item back to cart removes it from saved items and restores/merges cart quantity.
   - Removing a saved item does not affect cart items.
   - `clearCart()` reset behavior is explicit and tested.

**Risks**
- The current cart UI is not reactive; adding more module-level mutable functions would make the feature appear broken until another render happens.
- Quantity behavior for saved items needs a clear product decision. Recommended behavior: preserve quantity.
- Converting to Zustand changes the state access pattern; tests should cover exported functions and hook-backed behavior.
- If future persistence is desired, localStorage/session persistence should be added separately, not bundled into the first implementation.

**Tests**
- Update `tests/cartStore.test.ts`.
- Recommended test command: `npm run test`.
- Recommended final verification: `npm run build`.

**Safety Exclusions**
- Did not read `.env`.
- Did not read denied paths from Context Goblin exclusions:
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
- Did not modify files.
```

## openai/gpt-5.6-sol

### Summary

- Baseline completed: true
- Context Goblin completed and validated: true
- Tool use OK: true
- Answer OK: true
- Result: mixed
- Baseline direct file reads: 17
- Context Goblin built-in file reads: 13
- File-read reduction: 24%
- File-read status: pass
- Input-token reduction: 0%
- Input-token status: pass
- Total-token reduction: -17%
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

- Duration: 141000ms
- Tool calls: 27
- Input tokens: 16143
- Output tokens: 2829
- Reasoning tokens: 648
- Cache read tokens: 14336
- Total event tokens: 33956
- Cost: 0

Tool counts:

- glob: 6
- grep: 4
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
- In-memory cart state; no persistence or cart API.
- No lockfile, HTML entry point, React DOM mount, Vitest config, or ESLint config was found.

**Current Entry Points**
- Application export: `src/main.tsx:1`
- App composition: `src/App.tsx:3`
- Catalog/cart composition: `src/routes.tsx:3`
- Add-to-cart UI: `src/features/catalog/ProductCard.tsx:3`
- Cart UI: `src/features/cart/CartDrawer.tsx:2`
- Cart state and mutations: `src/features/cart/cartStore.ts:3`
- Cart behavior tests: `tests/cartStore.test.ts:4`

The current cart is a module-level mutable array. Mutations do not notify React, so `CartDrawer` will not reliably rerender after add, remove, or save operations. This should be addressed as part of the feature.

**Commands**
Existing package scripts:
- Development: `npm run dev`
- Build/type-check: `npm run build`
- Watch tests: `npm test`
- Lint: `npm run lint`

Recommended verification:
- One-shot tests: `npm test -- --run`
- Cart-only tests: `npm test -- --run tests/cartStore.test.ts`
- Full verification: `npm run build`, `npm test -- --run`, `npm run lint`

No commands were executed because the request restricted inspection to read, glob, and grep tools.

**Implementation Plan**
1. Refactor `src/features/cart/cartStore.ts` to use the already-installed Zustand package so React components subscribe to state changes.
2. Represent state with separate `items: CartItem[]` and `savedItems: CartItem[]` collections.
3. Add `saveForLater(productId)` that atomically removes the entire cart line, preserving its quantity, and inserts it into `savedItems`.
4. Add `moveToCart(productId)` that removes the saved line and restores it to the active cart.
5. Define duplicate handling explicitly: when moving into a collection that already contains the SKU, merge quantities rather than creating duplicate rows.
6. Keep `removeFromCart` scoped to active items. Add `removeSavedItem` only if saved items need independent deletion.
7. Make test reset clear both collections so tests remain isolated.
8. Update `src/features/cart/CartDrawer.tsx` to subscribe to active and saved state, render separate “Cart” and “Saved for later” sections, and expose “Save for later,” “Move to cart,” and existing remove actions.
9. Update `src/features/catalog/ProductCard.tsx` to invoke the reactive store action. Adding a catalog product should affect the active cart without silently deleting a saved copy unless product requirements specify otherwise.
10. Keep routing and API layers unchanged; this feature does not currently require a new route or backend request.

**Tests**
Extend `tests/cartStore.test.ts` with:
- Saving moves an item from active cart to saved items.
- Saved quantity is preserved.
- Moving a saved item restores it to the cart.
- Moving into an existing cart line merges quantities.
- Saving into an existing saved line merges quantities.
- Unknown product IDs are harmless no-ops.
- `clearCart` or the replacement reset operation clears active and saved state.
- Existing add, increment, and remove behavior remains intact.
- Returned state is not accidentally mutated outside store actions, if getter-style APIs remain.

A component interaction test would also be valuable, but no React testing library or DOM test environment is currently installed. Adding those dependencies is broader than the smallest implementation.

**Risks**
- The required behavior for adding a product that is already saved is unspecified. The least surprising default is to allow active and saved copies, then merge when explicitly moved.
- “Save for later” persistence across reloads or sessions is unspecified. Current state is memory-only.
- Zustand conversion changes the cart store’s public API. All known consumers are internal and limited to three files, but hidden consumers could require compatibility wrappers.
- `CartItem` imports `Product` from a UI component. Moving `Product` into a catalog model file would improve boundaries, but is optional scope.
- `getCartItems()` currently returns the mutable backing array. Preserving that API could allow external mutation.
- The fixture lacks a browser mount and HTML entry point, so build/runtime verification may expose unrelated baseline issues.
- Accessibility needs deliberate labels and section headings because current rows are represented only as action buttons.

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

Repository-wide focused searches also checked cart references, Zustand usage, persistence, API calls, rendering setup, styles, accessibility attributes, and test/config files.

**Safety Exclusions**
- `.env` was discovered by filename only and was not read.
- No files were created, modified, or deleted.
- No shell, task, subagent, network, or external tools were used.
- `opencode.json` was not inspected because it is unrelated to application cart behavior.
- No dependency, persistence, API, authentication, checkout, routing, or unrelated styling changes are proposed.
```

### Context Goblin

- Duration: 145000ms
- Tool calls: 19
- context_goblin_status: yes
- context_goblin_refresh: yes
- context_goblin_read: yes
- Input tokens: 16142
- Output tokens: 2378
- Reasoning tokens: 715
- Cache read tokens: 20480
- Total event tokens: 39715
- Cost: 0

Tool counts:

- context_goblin_read: 1
- context_goblin_refresh: 1
- context_goblin_stats: 1
- context_goblin_status: 1
- glob: 1
- grep: 1
- read: 13

Files read:

- README.md
- package.json
- src/App.tsx
- src/components/Button.tsx
- src/features/cart/CartDrawer.tsx
- src/features/cart/cartStore.ts
- src/features/catalog/ProductCard.tsx
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
- React
- Vite
- Zustand available but currently unused
- Vitest
- ESLint
- Package manager is indeterminate: no root lockfile was found

**Commands**
Defined in `package.json`:
- Development: `vite`
- Build: `tsc && vite build`
- Tests: `vitest`
- One-shot tests: `vitest run`
- Lint: `eslint src --ext ts,tsx`

Use the repository’s chosen package manager once established, for example `<package-manager> run test`.

**Entry Points**
- `src/main.tsx`: nominal entry, but only re-exports `App`; it does not mount React with `createRoot`.
- `src/App.tsx`: renders the header and catalog route.
- `src/routes.tsx`: composes `ProductList` and `CartDrawer`.
- `src/features/catalog/ProductCard.tsx`: current add-to-cart UI.
- `src/features/cart/CartDrawer.tsx`: current cart UI.
- `src/features/cart/cartStore.ts`: current cart state and operations.

**Recommended Changes**
1. `src/features/cart/cartStore.ts`
   - Convert the non-reactive module state to the already-installed Zustand store.
   - Store `items` and `savedItems` separately.
   - Add `saveForLater(productId)` to atomically move a cart item into saved items.
   - Add `moveToCart(productId)` to move it back.
   - Preserve quantity during transfers.
   - If the destination already contains that product, merge quantities rather than creating duplicate rows.
   - Treat unknown IDs as no-ops.
   - Keep removal scoped to the active cart unless a separate `removeSavedItem` action is explicitly desired.
   - Add a test-reset action or deterministic state replacement for isolation.

2. `src/features/catalog/ProductCard.tsx`
   - Select `addToCart` from the Zustand store so adding a product causes subscribed UI to update.
   - Preserve current behavior of incrementing quantity for an existing cart item.

3. `src/features/cart/CartDrawer.tsx`
   - Subscribe to cart items, saved items, and actions.
   - Render distinct “Cart” and “Saved for later” sections.
   - Add a “Save for later” action to each active cart row.
   - Add a “Move to cart” action to each saved row.
   - Retain the existing remove action.
   - Render useful empty states for both sections.
   - Use semantic headings/lists and explicit button labels.

4. `tests/cartStore.test.ts`
   - Migrate existing assertions to the Zustand API.
   - Add focused cart behavior tests, as required by `AGENTS.md`.

No new component or persistence layer is necessary for the initial implementation.

**Behavioral Tests**
- Adding a new product creates one cart row with quantity 1.
- Adding the same product increments quantity.
- Saving an item removes it from the cart and adds it to saved items.
- Saving preserves the entire quantity.
- Saving into an existing saved row merges quantities.
- Moving a saved item back removes it from saved items.
- Moving back preserves or merges quantity in the cart.
- Saving or restoring an unknown ID is a no-op.
- Removing a cart item does not remove its saved counterpart.
- Reset behavior clears both collections between tests.
- Existing add/remove behavior remains covered.

Component tests would require adding a React DOM testing dependency; none is currently declared. Store tests are the smallest appropriate initial test scope.

**Risks**
- The current store is not reactive. Extending only its arrays/functions would leave `CartDrawer` stale after button clicks.
- Transfer semantics need to be explicit. The recommended behavior moves the full quantity and merges duplicates.
- `clearCart` currently means only active cart state. Reusing it for test cleanup could leak saved state; introduce an explicit full reset rather than silently changing production semantics.
- Zustand migration changes all cart consumers, though grep found only `ProductCard`, `CartDrawer`, and the test.
- `getCartItems()` currently returns the mutable backing array. The migration removes that accidental mutation surface.
- `src/main.tsx` does not mount the application, and the theme stylesheet is not imported. These appear fixture-level limitations and are outside this feature.
- Dependencies use `"latest"` and there is no root lockfile, so installations and APIs are not reproducible.
- No persistence exists. “Save for later” will reset on refresh unless persistence is separately requested.
- Accessibility and layout cannot be fully validated without a rendered application and UI test setup.

**Files Inspected**
- Context Goblin cache via `context_goblin_read`
- `package.json`
- `README.md`
- `tsconfig.json`
- `vite.config.ts`
- `src/main.tsx`
- `src/App.tsx`
- `src/routes.tsx`
- `src/components/Button.tsx`
- `src/styles/theme.css`
- `src/features/catalog/ProductCard.tsx`
- `src/features/cart/cartStore.ts`
- `src/features/cart/CartDrawer.tsx`
- `tests/cartStore.test.ts`

A focused grep also verified all TypeScript/TSX cart API consumers. No root package-manager lockfile was found.

**Safety Exclusions**
Not read or recommended for modification:
- `.env`, `.env.*`
- `*.pem`, `*.key`
- `secrets.json`, `credentials.json`
- `node_modules/**`
- `.git/**`
- `dist/**`, `build/**`, `coverage/**`
- `.next/**`, `.nuxt/**`, `.output/**`
- `.opencode/cache/context-goblin/**`

No files were modified.
```
