# Context Goblin Token Usage A/B Report

Generated: 2026-07-10T17:13:25.470Z
OpenCode version: 1.17.18
Context Goblin version: 0.1.13
Model group: standard

## Tool Output Compaction

This report predates the `0.1.7` oversized tool-output compaction hook. Re-run the token benchmark with `0.1.7+` to measure effects on provider/OpenCode event accounting.

## Task

Measure token usage while planning where and how to add a "Save for later" feature to a realistic React/Vite cart and catalog app. The model must not modify files or read .env.

## Summary

| Model | Baseline Input | Goblin Input | Input Saved | Input Status | Baseline Total | Goblin Total | Total Saved | Total Status | Baseline Reads | Goblin Reads | File Saved | File Status | Cache Size | Token Result |
| --- | ---: | ---: | ---: | --- | ---: | ---: | ---: | --- | ---: | ---: | ---: | --- | ---: | --- |
| openai/gpt-5.5 | 12482 | 12188 | 2% | pass | 45585 | 58374 | -28% | fail | 16 | 9 | 44% | pass | 2580 | mixed |

## openai/gpt-5.5

### Summary

- Baseline completed: true
- Context Goblin completed and validated: true
- Tool use OK: true
- Answer OK: true
- Result: mixed
- Baseline direct file reads: 16
- Context Goblin built-in file reads: 9
- File-read reduction: 44%
- File-read status: pass
- Input-token reduction: 2%
- Input-token status: pass
- Total-token reduction: -28%
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

- Duration: 52000ms
- Tool calls: 21
- Input tokens: 12482
- Output tokens: 2149
- Reasoning tokens: 234
- Cache read tokens: 30720
- Total event tokens: 45585
- Cost: 0

Tool counts:

- glob: 5
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
- React + TypeScript
- Vite
- Vitest
- ESLint
- `zustand` is installed but current cart state is a plain module-level array, not a Zustand store.

**Commands**
- No shell commands executed.
- Available project scripts from `package.json`:
  - `npm run dev`
  - `npm run build`
  - `npm test`
  - `npm run lint`

**Entry Points**
- App entry/export: `src/main.tsx`
- App composition: `src/App.tsx`
- Route composition: `src/routes.tsx`
- Catalog add-to-cart UI: `src/features/catalog/ProductCard.tsx`
- Cart UI: `src/features/cart/CartDrawer.tsx`
- Cart state/actions: `src/features/cart/cartStore.ts`
- Existing cart tests: `tests/cartStore.test.ts`

**Files Inspected**
- `package.json`
- `README.md`
- `tsconfig.json`
- `vite.config.ts`
- `src/main.tsx`
- `src/App.tsx`
- `src/routes.tsx`
- `src/api/client.ts`
- `src/components/Header.tsx`
- `src/components/Button.tsx`
- `src/styles/theme.css`
- `src/features/catalog/ProductCard.tsx`
- `src/features/catalog/ProductList.tsx`
- `src/features/cart/CartDrawer.tsx`
- `src/features/cart/cartStore.ts`
- `tests/cartStore.test.ts`

**Implementation Plan**
1. Extend `src/features/cart/cartStore.ts` with saved-for-later state:
   - Add `savedItems: Product[]` or `SavedItem[]`.
   - Add `saveForLater(productId: string)` to move a cart item out of `items`.
   - Add `moveToCart(productId: string)` to move a saved item back into cart, respecting existing quantity merge behavior.
   - Add `removeSavedItem(productId: string)`.
   - Update `clearCart()` or add test reset behavior to clear both cart and saved items, depending expected semantics.

2. Keep the minimal module-level store model:
   - Do not introduce Zustand unless the feature needs reactive rendering beyond this fixture’s current pattern.
   - Maintain existing function-style API used by `ProductCard` and `CartDrawer`.

3. Update `src/features/cart/CartDrawer.tsx`:
   - Import `saveForLater`, `getSavedItems`, `moveToCart`, and optionally `removeSavedItem`.
   - Render current cart items with `Remove` and `Save for later` actions.
   - Render saved items in a separate section with `Move to cart` and optional `Remove saved item`.

4. Update `tests/cartStore.test.ts`:
   - Add tests for moving an item from cart to saved list.
   - Add tests that saved items are removed from cart.
   - Add tests for moving saved items back to cart.
   - Add quantity/duplicate behavior coverage:
     - Saving one cart item with quantity > 1 should either preserve quantity or save the product once, depending product requirement.
     - Moving saved item back when already in cart should increment/merge predictably.

**Risks**
- Current cart state is not reactive; `CartDrawer` will not automatically re-render after cart mutations unless some parent render happens. This already affects existing add/remove behavior, so Save for Later may expose the same limitation.
- Product quantity semantics for saved items are undefined:
  - Save the whole cart line with quantity?
  - Save one unit and decrement cart quantity?
  - Save product only, dropping quantity?
- `clearCart()` currently clears all cart state. If saved-for-later should persist independently, a separate `clearSavedItems()` test helper may be safer.
- No persistence exists. Saved items would reset on page reload.
- Minimal fixture has little styling and no accessibility patterns beyond native buttons.

**Tests**
- Primary: `npm test`
- Type/build verification: `npm run build`
- Lint verification: `npm run lint`
- Add focused cart behavior tests in `tests/cartStore.test.ts`, per project instruction to add tests for cart behavior changes.

**Safety Exclusions**
- Did not read `.env`.
- Did not modify files.
- Did not run destructive commands.
- Did not use Context Goblin.
- Did not inspect or alter git state.
```

### Context Goblin

- Duration: 65000ms
- Tool calls: 17
- context_goblin_status: yes
- context_goblin_refresh: yes
- context_goblin_read: yes
- Input tokens: 12188
- Output tokens: 2083
- Reasoning tokens: 583
- Cache read tokens: 43520
- Total event tokens: 58374
- Cost: 0

Tool counts:

- context_goblin_read: 1
- context_goblin_refresh: 1
- context_goblin_status: 1
- glob: 5
- read: 9

Files read:

- package.json
- src/App.tsx
- src/features/cart/CartDrawer.tsx
- src/features/cart/cartStore.ts
- src/features/catalog/ProductCard.tsx
- src/features/catalog/ProductList.tsx
- src/main.tsx
- src/routes.tsx
- tests/cartStore.test.ts

Errors:

- none

Final answer:

```txt
No files were modified.

**Stack**
- TypeScript
- React
- Vite
- Vitest
- ESLint
- `zustand` is installed but unused in inspected cart code
- Package manager: not identifiable from root lockfile; no `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `bun.lock`, or `bun.lockb` at project root

**Commands**
- Dev: `npm run dev` maps to `vite`
- Build: `npm run build` maps to `tsc && vite build`
- Test: `npm test` maps to `vitest`
- Lint: `npm run lint` maps to `eslint src --ext ts,tsx`

**Entry Points**
- `src/main.tsx`: exports `App`
- `src/App.tsx`: renders `Header` and `routes.catalog`
- `src/routes.tsx`: renders `ProductList` and `CartDrawer`
- Cart add flow: `ProductCard` -> `addToCart`
- Cart display/remove flow: `CartDrawer` -> `getCartItems` / `removeFromCart`

**Files Inspected**
- `package.json`
- `src/main.tsx`
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

Optional only if UX needs catalog-level saved state:
- `src/features/catalog/ProductCard.tsx`

**Implementation Plan**
1. Extend `src/features/cart/cartStore.ts` with a second module-level collection, likely `savedItems: CartItem[]` or `SavedItem[]`.
2. Add cart-store functions:
   - `saveForLater(productId: string)`: move item from cart to saved list.
   - `moveSavedToCart(productId: string)`: move saved item back into cart, merging quantity if already present.
   - `removeSavedItem(productId: string)`: delete from saved list.
   - `getSavedItems()`: return saved items.
   - Update `clearCart()` to clear both cart and saved items for tests.
3. Add change notification support because current UI reads module state directly and will not reliably re-render after mutations:
   - Add a tiny `subscribe` / `emit` mechanism.
   - Export a React hook such as `useCartState()` using `useSyncExternalStore`.
   - Have all mutating functions call `emit()`.
4. Update `CartDrawer.tsx`:
   - Replace direct `getCartItems()` render with `useCartState()`.
   - Render current cart items with `Remove` and `Save for later` actions.
   - Render saved items separately with `Move to cart` and optionally `Remove`.
5. Keep `ProductCard.tsx` unchanged unless the feature should allow saving directly from product listings.
6. Add tests in `tests/cartStore.test.ts` for:
   - Saving a cart item removes it from cart and adds it to saved.
   - Moving a saved item back to cart removes it from saved.
   - Moving back merges quantity if same product is already in cart.
   - Removing a saved item only affects saved items.
   - `clearCart()` resets cart and saved lists.

**Risks**
- Current cart UI is not reactive; adding “Save for later” without a subscription hook would make UI behavior flaky or invisible after clicks.
- `getCartItems()` currently returns the mutable internal array, so tests or callers could mutate store state accidentally. Consider returning copies if tightening behavior.
- Product shape is minimal: `{ id, name, price }`. If saved items later need timestamps or notes, introduce a separate saved-item type.
- No persistence exists. “Save for later” would be session/module-memory only unless localStorage or backend support is explicitly added.
- Function name `clearCart()` may become misleading if it clears saved items too; tests can document intended reset semantics.

**Tests**
- Run `npm test` for cart store behavior.
- Run `npm run build` for TypeScript and Vite validation.
- Run `npm run lint` if ESLint config is present and dependencies are installed.

**Safety Exclusions**
- Did not read `.env` or `.env.*`.
- Did not read secret-looking files.
- Did not inspect `node_modules`, `.git`, build outputs, coverage, or Context Goblin cache internals beyond the required cache read.
- Did not modify files.
```
