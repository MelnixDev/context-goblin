# General Model Context Goblin A/B Report

Generated: 2026-07-13T09:35:36.198Z
OpenCode version: 1.17.18
Context Goblin version: 0.1.14
Model group: standard

## Task

Plan where and how to add a "Save for later" feature to a realistic React/Vite cart and catalog app. The model must not modify files or read .env.

## Summary

| Model | Baseline OK | Tool Use OK | Answer OK | Baseline Reads | Goblin Reads | File Reduction | Input Token Reduction | Quality | Cache Size | Secret Leak | Result |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| openai/gpt-5.5 | yes | yes | yes | 16 | 7 | 56% | 14% | 6/6 | 2580 | pass | pass |

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
- Input-token reduction: 14%
- Input-token status: pass
- Total-token reduction: -2%
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

- Duration: 61000ms
- Tool calls: 23
- Input tokens: 12924
- Output tokens: 2317
- Reasoning tokens: 253
- Cache read tokens: 32768
- Total event tokens: 48262
- Cost: 0

Tool counts:

- glob: 6
- grep: 1
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
React + TypeScript + Vite app with Vitest tests. `zustand` is installed but current cart state is a plain module-level array in `src/features/cart/cartStore.ts`.

**Commands**
No shell commands were run. I used focused file/glob/content inspection only.

Useful verification commands for implementation:

- `npm test`
- `npm run build`
- `npm run lint`

**Entry Points**
- `src/App.tsx`: renders `Header` and `routes.catalog`
- `src/routes.tsx`: composes `<ProductList />` and `<CartDrawer />`
- `src/features/catalog/ProductCard.tsx`: calls `addToCart(product)`
- `src/features/cart/CartDrawer.tsx`: renders cart items and removes items
- `src/features/cart/cartStore.ts`: cart state and cart actions
- `tests/cartStore.test.ts`: existing cart behavior tests

**Files Inspected**
- `AGENTS.md`
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
- `src/styles/theme.css`
- `src/features/catalog/ProductCard.tsx`
- `src/features/catalog/ProductList.tsx`
- `src/features/cart/CartDrawer.tsx`
- `src/features/cart/cartStore.ts`
- `tests/cartStore.test.ts`

**Implementation Plan**
1. Extend `src/features/cart/cartStore.ts` with a second module-level collection, likely `savedItems: Product[]`.
2. Add actions:
   - `saveForLater(productId: string)`: find cart item, remove it from `items`, add product data to saved list if not already saved.
   - `moveToCart(productId: string)`: find saved item, remove it from saved list, call `addToCart`.
   - `removeSavedItem(productId: string)`: remove from saved list.
   - `getSavedItems()`: return saved list.
   - Update `clearCart()` to reset both cart and saved state, or add `clearSavedItems()` if tests need separate control.
3. Update `src/features/cart/CartDrawer.tsx`:
   - Import new store actions.
   - Add a “Save for later” button next to each cart item.
   - Render a saved-for-later section below cart items.
   - Add “Move to cart” and possibly “Remove” actions for saved items.
4. Add tests in `tests/cartStore.test.ts`:
   - Saving moves an item out of cart and into saved items.
   - Saving the same product does not duplicate saved items.
   - Moving saved item back to cart removes it from saved list and restores cart quantity behavior.
   - Removing saved item only affects saved list.
   - `clearCart()` resets all cart-related module state if implemented that way.

**Risks**
- Current UI is not reactive. `CartDrawer` calls `getCartItems()` during render, but `addToCart`, `removeFromCart`, and proposed save actions do not trigger React state updates. The feature can be implemented consistently with current code, but UI updates may not appear without a parent re-render.
- `getCartItems()` currently returns the mutable `items` array directly. Tests or UI could accidentally mutate internal state. Same risk applies to `getSavedItems()` unless arrays are copied.
- Product typing lives in `ProductCard.tsx`, which is an awkward source for domain types. A clean implementation might move `Product` to a shared type file, but the minimal implementation should avoid that unless desired.
- `clearCart()` name may become misleading if it also clears saved-for-later items. For test isolation it is practical, but a separate reset helper may be clearer.
- No persistence currently exists. “Save for later” would be session-memory only unless localStorage/API behavior is explicitly required.

**Tests**
Add or update `tests/cartStore.test.ts`; project instruction explicitly says to add tests for cart behavior changes.

Recommended assertions:

- `saveForLater("sku-1")` changes cart length from `1` to `0`.
- `getSavedItems()` contains `{ id: "sku-1", name: "Goblin Mug", price: 12 }`.
- Saving an item twice does not create duplicates.
- `moveToCart("sku-1")` moves the product from saved list back to cart with `quantity: 1`.
- `removeSavedItem("sku-1")` removes only from saved list.
- Existing add/remove tests still pass.

**Safety Exclusions**
- Did not read `.env`.
- Did not modify files.
- Did not run commands that write files.
- Did not use Context Goblin.
- Did not inspect unrelated dependency internals or generated files.
```

### Context Goblin

- Duration: 51000ms
- Tool calls: 11
- context_goblin_status: yes
- context_goblin_refresh: yes
- context_goblin_read: yes
- Input tokens: 11133
- Output tokens: 1846
- Reasoning tokens: 187
- Cache read tokens: 35840
- Total event tokens: 49006
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
- TypeScript
- React
- Vite
- Zustand dependency exists, but current cart store is a simple module-level array, not Zustand.
- Tests: Vitest
- Lint/build: ESLint, `tsc && vite build`
- Package manager: likely npm, because `.opencode/package-lock.json` exists, but root lockfile was not inspected.

**Commands**
- Existing scripts from `package.json`:
  - `npm run dev` -> `vite`
  - `npm run build` -> `tsc && vite build`
  - `npm test` -> `vitest`
  - `npm run lint` -> `eslint src --ext ts,tsx`
- Recommended verification after implementation:
  - `npm test`
  - `npm run build`
  - `npm run lint`

**Entry Points**
- App entry: `src/main.tsx`
- Route composition: `src/routes.tsx`
- Cart UI entry: `src/features/cart/CartDrawer.tsx`
- Cart state entry: `src/features/cart/cartStore.ts`
- Catalog add-to-cart entry: `src/features/catalog/ProductCard.tsx`

**Exact Files Inspected**
- `package.json`
- `src/features/cart/cartStore.ts`
- `src/features/cart/CartDrawer.tsx`
- `src/features/catalog/ProductCard.tsx`
- `src/features/catalog/ProductList.tsx`
- `src/routes.tsx`
- `tests/cartStore.test.ts`
- Context Goblin cache: `.opencode/cache/context-goblin/project-context.md` via `context_goblin_read`

**Recommended Files To Change**
- `src/features/cart/cartStore.ts`
- `src/features/cart/CartDrawer.tsx`
- `tests/cartStore.test.ts`

Optional only if UX needs it:
- `src/features/catalog/ProductCard.tsx`, if saved items should be restorable directly from product cards or visually marked in catalog.
- New file `src/features/cart/SavedForLaterList.tsx`, only if `CartDrawer.tsx` becomes too cramped.

**Implementation Plan**
1. Extend `cartStore.ts` with a second module-level collection:
   - Keep `items: CartItem[]` for active cart items.
   - Add `savedItems: CartItem[]` or `Product[]` for saved-for-later items.
   - Prefer `CartItem[]` if preserving quantity matters when restoring.
2. Add store functions:
   - `saveForLater(productId: string)`: move matching item from `items` to `savedItems`.
   - `moveToCart(productId: string)`: move matching saved item back to `items`, merging quantity if the item already exists in cart.
   - `removeSavedItem(productId: string)`: remove an item from saved list.
   - `getSavedItems()`: return saved list.
   - Update `clearCart()` to clear both cart and saved items, because tests use it as test isolation.
3. Update `CartDrawer.tsx`:
   - Import `saveForLater`, `getSavedItems`, `moveToCart`, and `removeSavedItem`.
   - For each cart item, add a `Save for later {item.name}` button next to/remove alternative to the current remove button.
   - Render a saved-for-later section inside the drawer with:
     - `Move to cart {item.name}`
     - `Remove saved {item.name}`
4. Add tests in `tests/cartStore.test.ts`:
   - Saving an item removes it from cart and adds it to saved.
   - Moving a saved item restores it to cart and removes it from saved.
   - Moving back merges quantity when cart already has the same SKU.
   - Removing saved item only affects saved list.
   - `clearCart()` clears both active and saved items.

**Behavior Details To Decide**
- Recommended: “Save for later” moves the full cart line item, including quantity.
- Recommended: adding the same product again while it is saved should leave saved unchanged and add to cart normally, unless the desired UX is to unsave automatically.
- Recommended: moving saved item to cart should merge quantities rather than duplicate rows.

**Risks**
- Current store is not reactive. `CartDrawer` calls getters directly, so UI may not re-render after mutations unless some parent render happens. This already affects add/remove and will also affect save-for-later.
- Zustand is installed but unused. A robust implementation would migrate the cart store to Zustand, but the smallest change is to follow the existing module-level store pattern.
- `getCartItems()` currently returns the mutable internal array. `getSavedItems()` should probably match existing style for minimal change, but returning copies would be safer if refactoring.
- There is no persisted storage, so saved-for-later items disappear on refresh. Persistence should not be added unless requested.
- `clearCart()` naming becomes slightly broader if it clears saved items too. This is acceptable for test isolation, but a separate `clearSavedItems()` could be added if product behavior needs separation.

**Tests**
- Add focused Vitest coverage to `tests/cartStore.test.ts`.
- Recommended test cases:
  - `saveForLater("sku-1")` moves active item to saved list.
  - `moveToCart("sku-1")` moves saved item back to active cart.
  - `moveToCart` merges quantities when active cart already contains the SKU.
  - `removeSavedItem("sku-1")` removes only saved item.
  - `clearCart()` resets both lists.
- Run:
  - `npm test`
  - `npm run build`
  - `npm run lint`

**Safety Exclusions**
- Did not read `.env` or `.env.*`.
- Did not inspect denied/secret-looking paths.
- Did not modify files.
- Avoided broad discovery reads; used Context Goblin first, then inspected only cart/catalog/test/package files needed for the plan.
```

