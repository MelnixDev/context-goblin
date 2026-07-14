# Context Goblin Token Usage A/B Report

Generated: 2026-07-13T09:38:03.228Z
OpenCode version: 1.17.18
Context Goblin version: 0.1.14
Model group: standard

## Task

Measure token usage while planning where and how to add a "Save for later" feature to a realistic React/Vite cart and catalog app. The model must not modify files or read .env.

## Summary

| Model | Baseline Input | Goblin Input | Input Saved | Input Status | Baseline Total | Goblin Total | Total Saved | Total Status | Baseline Reads | Goblin Reads | File Saved | File Status | Cache Size | Token Result |
| --- | ---: | ---: | ---: | --- | ---: | ---: | ---: | --- | ---: | ---: | ---: | --- | ---: | --- |
| openai/gpt-5.5 | 9202 | 8131 | 12% | pass | 51391 | 56252 | -9% | fail | 15 | 7 | 53% | pass | 2580 | mixed |

## openai/gpt-5.5

### Summary

- Baseline completed: true
- Context Goblin completed and validated: true
- Tool use OK: true
- Answer OK: true
- Result: mixed
- Baseline direct file reads: 15
- Context Goblin built-in file reads: 7
- File-read reduction: 53%
- File-read status: pass
- Input-token reduction: 12%
- Input-token status: pass
- Total-token reduction: -9%
- Total-token status: fail
- Quality score: 6/6
- Quality hits: cartStore.ts, CartDrawer.tsx, catalog product file, tests, risks, safety exclusions
- Required quality hits: save-for-later feature, cart state, cart UI, cart tests
- Quality disqualifiers: none
- Cache size: 2580 bytes
- Secret leakage: none detected
- Baseline errors: 0
- Context Goblin errors: 0

### Baseline

- Duration: 81000ms
- Tool calls: 21
- Input tokens: 9202
- Output tokens: 2504
- Reasoning tokens: 773
- Cache read tokens: 38912
- Total event tokens: 51391
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
- React + TypeScript + Vite.
- Tests: Vitest.
- State: plain module-level in-memory arrays in `src/features/cart/cartStore.ts`.
- Dependency note: `zustand` exists in `package.json` but is not currently used.

**Commands**
- Available scripts from `package.json`:
  - `npm run dev`
  - `npm run build`
  - `npm test`
  - `npm run lint`
- Recommended verification after implementation:
  - `npm test -- --run`
  - `npm run build`
  - `npm run lint`
- I did not run package commands because this request was inspection/planning only.

**Entry Points**
- App export: `src/main.tsx`
- App composition: `src/App.tsx`
- Route composition: `src/routes.tsx`
- Cart UI: `src/features/cart/CartDrawer.tsx`
- Cart state: `src/features/cart/cartStore.ts`
- Add-to-cart UI: `src/features/catalog/ProductCard.tsx`

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
- `src/features/cart/cartStore.ts`
- `src/features/cart/CartDrawer.tsx`
- `src/features/catalog/ProductCard.tsx`
- `src/features/catalog/ProductList.tsx`
- `tests/cartStore.test.ts`

**Implementation Plan**
1. Update `src/features/cart/cartStore.ts`.
   - Add a saved-for-later collection, likely `let savedForLaterItems: Product[] = []`.
   - Add `saveForLater(productId: string)` that finds a cart item, removes it from cart, and stores the product data without `quantity`.
   - Add `moveSavedItemToCart(productId: string)` that removes from saved-for-later and calls `addToCart`.
   - Add `removeFromSavedForLater(productId: string)`.
   - Add `getSavedForLaterItems()`.
   - Add `clearSavedForLater()` for tests.
   - Deduplicate saved items by `id` so repeated saves do not create duplicates.

2. Update `src/features/cart/CartDrawer.tsx`.
   - Import the new store functions.
   - Render current cart items with both `Save for later` and `Remove` actions.
   - Render a saved-for-later section with saved items.
   - Add `Move to cart` and `Remove` actions for saved items.

3. Address current UI re-render limitation.
   - Existing cart state mutates module variables and does not notify React, so `addToCart`, `removeFromCart`, and future save actions will not reliably re-render UI.
   - Smallest correct approach: add a simple subscription/version mechanism to `cartStore.ts` and have `CartDrawer` use `useSyncExternalStore`.
   - Alternative larger approach: migrate cart state to Zustand since it is already a dependency, but that is less minimal.

4. Update `tests/cartStore.test.ts`.
   - Import new save-for-later functions.
   - Add tests for:
     - saving a cart item removes it from cart and adds it to saved-for-later;
     - moving a saved item back to cart removes it from saved-for-later and restores quantity behavior through `addToCart`;
     - removing a saved item only affects saved-for-later;
     - duplicate saves do not duplicate saved entries.
   - Update `beforeEach` to clear both cart and saved-for-later state.

**Risks**
- Current `getCartItems()` returns the live internal array, so external mutation can corrupt store state. A save-for-later change could either preserve this behavior or safely return copies; changing it may affect tests/consumers.
- Current `addToCart` mutates existing item objects in place. If React subscription is added, notifications must happen after all mutations.
- `clearCart()` currently clears only cart items. Expanding it to also clear saved-for-later would be convenient but could be a semantic change; better to add `clearSavedForLater()`.
- No persistence exists. Saved-for-later would be in-memory only unless explicitly expanded to localStorage/API.
- There is no backend/API contract for saved items.
- Existing UI is extremely minimal and not styled; adding accessible labels/sections may slightly change rendered markup.

**Tests**
- Primary: `npm test -- --run`
- Type/build: `npm run build`
- Lint: `npm run lint`
- Add focused cart behavior coverage in `tests/cartStore.test.ts` per project instruction.

**Safety Exclusions**
- Did not read `.env`.
- Did not modify files.
- Did not run commands that write, format, install, or generate files.
- Did not inspect unrelated hidden/config files beyond the provided project instructions.
```

### Context Goblin

- Duration: 53000ms
- Tool calls: 11
- context_goblin_status: yes
- context_goblin_refresh: yes
- context_goblin_read: yes
- Input tokens: 8131
- Output tokens: 1821
- Reasoning tokens: 220
- Cache read tokens: 46080
- Total event tokens: 56252
- Cost: 0

Tool counts:

- context_goblin_read: 1
- context_goblin_refresh: 1
- context_goblin_stats: 1
- context_goblin_status: 1
- read: 7

Files read:

- package.json
- src/App.tsx
- src/features/cart/CartDrawer.tsx
- src/features/cart/cartStore.ts
- src/features/catalog/ProductCard.tsx
- src/routes.tsx
- tests/cartStore.test.ts

Errors:

- none

Final answer:

```txt
**Stack**
- TypeScript, React, Vite, Node.js
- Test runner: Vitest
- State style today: module-level in-memory cart store in `src/features/cart/cartStore.ts`
- Package manager: not confirmed from root files; `package.json` scripts are standard npm-compatible.

**Commands**
- Dev: `npm run dev`
- Build: `npm run build`
- Test: `npm run test`
- Lint: `npm run lint`
- Underlying scripts:
  - `vite`
  - `tsc && vite build`
  - `vitest`
  - `eslint src --ext ts,tsx`

**Entry Points**
- App entry: `src/main.tsx`
- Main app shell: `src/App.tsx`
- Route composition: `src/routes.tsx`
- Cart UI: `src/features/cart/CartDrawer.tsx`
- Cart behavior: `src/features/cart/cartStore.ts`
- Catalog add-to-cart entry: `src/features/catalog/ProductCard.tsx`

**Files Inspected**
- `package.json`
- `src/App.tsx`
- `src/routes.tsx`
- `src/features/cart/cartStore.ts`
- `src/features/cart/CartDrawer.tsx`
- `src/features/catalog/ProductCard.tsx`
- `tests/cartStore.test.ts`

**Files Recommended To Change**
- `src/features/cart/cartStore.ts`
- `src/features/cart/CartDrawer.tsx`
- `tests/cartStore.test.ts`

**Optional Files**
- `src/features/catalog/ProductCard.tsx`: only if saved items should be restorable from catalog state or rendered differently when saved.
- `src/features/catalog/ProductList.tsx`: only if catalog needs to show saved status.
- `src/routes.tsx`: likely no change needed because `CartDrawer` is already rendered.

**Implementation Plan**
1. Extend `cartStore.ts` with a separate in-memory saved list.
   - Add `let savedItems: Product[] = []`.
   - Export `getSavedItems()`.
   - Export `saveForLater(productId: string)`.
   - Export `moveSavedToCart(productId: string)`.
   - Update `clearCart()` to clear both `items` and `savedItems`, or add a separate `clearSavedItems()` if tests need finer reset behavior.

2. Define save behavior precisely.
   - `saveForLater(productId)` should find the item in `items`.
   - Remove the item from cart.
   - Add it to `savedItems` if not already present.
   - Store saved item without `quantity`, or keep `quantity` if the intended UX is to restore the same quantity.
   - Recommended: preserve `quantity` by storing `CartItem[]` as saved items, because “save for later” usually implies restoring what the user had selected.

3. Add restore behavior.
   - `moveSavedToCart(productId)` should find the saved item.
   - Remove it from saved.
   - Re-add it to cart.
   - If preserving quantity, push the saved `CartItem` back or merge quantities with an existing cart item.

4. Update `CartDrawer.tsx`.
   - Import `saveForLater`, `getSavedItems`, and `moveSavedToCart`.
   - For each cart item, render both:
     - `Remove {item.name}`
     - `Save for later {item.name}`
   - Render a saved-for-later section inside the same `<aside>`.
   - For each saved item, render:
     - `Move to cart {item.name}`
     - Optionally `Remove saved {item.name}` if product removal from saved list is desired.

5. Add tests in `tests/cartStore.test.ts`.
   - Saving an item removes it from cart.
   - Saving an item adds it to saved items.
   - Saving the same item twice does not duplicate it.
   - Moving saved item back restores it to cart and removes it from saved.
   - `clearCart()` resets cart and saved state if that is the chosen reset contract.

**Risks**
- Current cart store is not reactive. `CartDrawer` calls `getCartItems()` directly, so UI will not automatically re-render after `addToCart`, `removeFromCart`, or future save actions unless another render happens. The app already has this limitation.
- `zustand` is installed but unused. A fuller fix could migrate cart state to Zustand, but that is larger than needed for this feature.
- Current `getCartItems()` returns the mutable backing array. Tests or components could mutate store state accidentally. Same risk applies to a future `getSavedItems()` unless it returns a copy.
- Preserving quantity vs saving only product identity is a product decision. I recommend preserving quantity unless told otherwise.
- No persistence exists. Saved-for-later items will be lost on page refresh.

**Tests**
- Add cart behavior tests to `tests/cartStore.test.ts`.
- Run `npm run test`.
- Run `npm run build`.
- Run `npm run lint` if ESLint config is present and functional.

**Safety Exclusions**
- Did not read or modify `.env`.
- Did not read denied paths from Context Goblin:
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
- No files were modified.
```

