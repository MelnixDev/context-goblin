# General Model Context Goblin A/B Report

Generated: 2026-10-08T07:38:24.128Z
OpenCode version: 1.18.20
Context Goblin version: 0.1.22
Model group: custom

## Task

Plan where and how to add a "Save for later" feature to a realistic React/Vite cart and catalog app. The model must not modify files or read .env.

## Protocol

- Each arm receives a fresh copy of the same synthetic fixture.
- The `task`, `bash`, and `edit` tools are explicitly denied so repository reads remain visible and comparable in the parent OpenCode event stream.
- Models may use direct `read`, `glob`, and `grep` tools; the Context Goblin arm may additionally use Context Goblin tools.
- File-read counts are distinct files read by the built-in `read` tool; `glob` and `grep` inputs do not count as file reads.
- Results are one run per model and arm. Model behavior and provider token accounting can vary between runs.
- Compatibility passes only when both arms complete, the single-call tool flow and safety checks pass, and both answers cover all six checklist items and the required feature scope.
- The 6/6 checklist measures answer coverage, not independent proof of semantic correctness. Read the captured answers before making a quality claim.
- Overall efficiency passes only when file reads, uncached input tokens, and total event tokens all improve. Any regression fails; `mixed` is reserved for non-regressing but flat or unavailable evidence.

## Summary

| Model | Baseline OK | Tool Use OK | Answer OK | Baseline Reads | Goblin Reads | File Reduction | Input Token Reduction | Total Token Reduction | Quality | Cache Size | Secret Leak | Compatibility | Overall |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |
| openai/gpt-5.5 | yes | yes | yes | 17 | 8 | 53% | -28% | 7% | 6/6 | 2449 | pass | pass | fail |
| openai/gpt-5.6-sol | yes | yes | yes | 17 | 9 | 47% | 51% | 34% | 6/6 | 2449 | pass | pass | pass |

## openai/gpt-5.5

### Summary

- Baseline completed: true
- Context Goblin completed and validated: true
- Tool use OK: true
- Answer OK: true
- Compatibility result: pass
- Overall efficiency result: fail
- Baseline direct file reads: 17
- Context Goblin built-in file reads: 8
- File-read reduction: 53%
- File-read status: pass
- Input-token reduction: -28%
- Input-token status: fail
- Total-token reduction: 7%
- Total-token status: pass
- Quality score: 6/6
- Quality hits: cartStore.ts, CartDrawer.tsx, catalog product file, tests, risks, safety exclusions
- Required quality hits: save-for-later feature, cart state, cart UI, cart tests
- Quality disqualifiers: none
- Cache size: 2449 bytes
- Secret leakage: none detected
- Baseline errors: 0
- Context Goblin errors: 0

### Baseline

- Duration: 32000ms
- Tool calls: 19
- Input tokens: 11610
- Output tokens: 2075
- Reasoning tokens: 172
- Cache read tokens: 22528
- Total event tokens: 36385
- Cost: 0

Tool counts:

- glob: 1
- grep: 1
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
- React + TypeScript + Vite
- Vitest for tests
- ESLint configured via `package.json`
- `zustand` dependency exists but current cart state is a module-level array, not Zustand-backed

**Commands / Tool Queries Used**
- `glob("**/*")`
- `grep("cart|Cart|basket|Basket|checkout|Checkout", include="*.{js,jsx,ts,tsx,json,md}")`
- `read(...)` on focused project files only
- No shell commands were run.

**Entry Points**
- App composition: `src/App.tsx`
- Route composition: `src/routes.tsx`
- Catalog add-to-cart UI: `src/features/catalog/ProductCard.tsx`
- Cart UI: `src/features/cart/CartDrawer.tsx`
- Cart state/actions: `src/features/cart/cartStore.ts`
- Cart tests: `tests/cartStore.test.ts`

**Exact Files Inspected**
- `AGENTS.md`
- `README.md`
- `package.json`
- `tsconfig.json`
- `vite.config.ts`
- `src/App.tsx`
- `src/main.tsx`
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

**Implementation Plan**
1. Extend `src/features/cart/cartStore.ts` with a second module-level collection, likely `savedItems: CartItem[] = []`.
2. Add store APIs:
   - `saveForLater(productId: string)`: move an item from `items` to `savedItems`.
   - `moveToCart(productId: string)`: move an item from `savedItems` back to `items`, merging quantity if the item already exists in cart.
   - `getSavedItems()`: return saved items.
   - Update `clearCart()` to clear both cart and saved state for test isolation.
3. Update `src/features/cart/CartDrawer.tsx`:
   - Import `saveForLater`, `moveToCart`, and `getSavedItems`.
   - Render current cart items with both `Remove` and `Save for later` actions.
   - Render saved items in a separate section with `Move to cart`.
4. Add cart behavior tests in `tests/cartStore.test.ts`:
   - Saving an item removes it from cart and adds it to saved items.
   - Moving saved item back removes it from saved items and restores it to cart.
   - Moving saved item into a cart that already contains the same product merges quantities.
   - `clearCart()` clears both active and saved items.
5. Optional small cleanup:
   - Consider returning shallow copies from `getCartItems()` and `getSavedItems()` to avoid external mutation, but this is broader behavior and should be weighed against minimality.

**Risks**
- Current module-level array mutations do not trigger React re-renders by themselves; existing UI already has this limitation. The new feature can follow existing behavior, but the UI may not visually update unless some parent re-renders.
- `getCartItems()` currently returns the live array, so callers/tests could mutate state accidentally.
- `saveForLater` semantics need a product decision: save full quantity as one saved item, or save one unit at a time. I would default to moving the full cart line item.
- If saved items should persist across sessions, current in-memory store is insufficient. No persistence currently exists.
- `zustand` is installed but unused; introducing it would be a larger architectural change and not necessary for a minimal feature.

**Tests**
- Run `npm test` for Vitest cart-store coverage.
- Run `npm run build` for TypeScript/build validation.
- If lint config is complete in the environment, run `npm run lint`.

**Safety Exclusions**
- Did not read `.env`.
- Did not modify files.
- Did not use task/subagents.
- Did not use bash or shell commands.
- Used only built-in `read`, `glob`, and `grep` tools.
```

### Context Goblin

- Duration: 30000ms
- Tool calls: 11
- context_goblin_get: yes
- context_goblin_status: no
- context_goblin_refresh: no
- context_goblin_read: no
- Input tokens: 14880
- Output tokens: 1820
- Reasoning tokens: 228
- Cache read tokens: 16896
- Total event tokens: 33824
- Cost: 0

Tool counts:

- context_goblin_get: 1
- glob: 1
- grep: 1
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
- State is currently plain module-level in-memory data in `src/features/cart/cartStore.ts`
- Package manager is not pinned at repo root; no root lockfile found

**Commands**
- `npm run dev`: Vite dev server
- `npm run build`: `tsc && vite build`
- `npm run test`: Vitest
- `npm run lint`: ESLint over `src --ext ts,tsx`

**Entry Points**
- App entry: `src/main.tsx`
- App composition: `src/App.tsx`
- Route composition: `src/routes.tsx`
- Catalog UI: `src/features/catalog/ProductList.tsx`
- Add-to-cart interaction: `src/features/catalog/ProductCard.tsx`
- Cart UI: `src/features/cart/CartDrawer.tsx`
- Cart state/actions: `src/features/cart/cartStore.ts`

**Files Inspected**
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

Optional only if UX needs a product-level restore/add affordance:
- `src/features/catalog/ProductCard.tsx`

**Implementation Plan**
1. Extend `src/features/cart/cartStore.ts` with a second module-level collection for saved items.
2. Add a new exported type if useful, likely reusing `Product` for saved items and keeping `CartItem` for active cart items.
3. Add `saveForLater(productId: string)`:
   - Find the cart item by `id`.
   - Remove it from `items`.
   - Add the product fields to `savedItems` if not already saved.
   - Drop `quantity` when saving, unless product quantity should be preserved by requirement.
4. Add `moveSavedToCart(productId: string)`:
   - Find saved item by `id`.
   - Remove it from `savedItems`.
   - Call `addToCart(product)` to restore it to the cart.
5. Add `getSavedItems()` for rendering and tests.
6. Update `clearCart()` to reset both active cart and saved-for-later state so existing test isolation remains reliable.
7. Update `src/features/cart/CartDrawer.tsx`:
   - Import `saveForLater`, `getSavedItems`, and `moveSavedToCart`.
   - Render active cart items with both `Remove` and `Save for later` actions.
   - Render a separate saved-for-later section with a `Move to cart` action.
8. Add cart-store tests in `tests/cartStore.test.ts`:
   - Saving removes the item from cart.
   - Saving exposes the item via `getSavedItems()`.
   - Saving the same product does not duplicate saved items.
   - Moving saved item back adds it to cart and removes it from saved items.
   - `clearCart()` clears both collections.

**Risks**
- Current store is not reactive. `CartDrawer` calls `getCartItems()` during render, but store mutations alone may not trigger React re-rendering. The new feature can follow the existing architecture, but UI updates may remain stale unless a parent render occurs.
- Existing `zustand` dependency suggests the app may be intended to use a reactive store, but current implementation does not. A larger fix would migrate cart state to Zustand, but that is beyond the minimal “Save for later” change.
- Quantity semantics need a product decision: saving could discard quantity or preserve it. Minimal UX usually saves the product once and restores quantity `1`.
- In-memory state means saved items disappear on refresh. Persistence should not be added unless explicitly required.

**Tests**
- Recommended verification:
  - `npm run test`
  - `npm run build`
  - `npm run lint`
- Most important added coverage belongs in `tests/cartStore.test.ts` because project instructions specifically prefer tests for cart behavior changes.

**Safety Exclusions**
- Did not read `.env` or secret-looking files.
- Did not inspect denied/cache/build paths.
- Did not modify files.
- Did not use bash, task/subagents, or extra Context Goblin calls beyond the requested single `context_goblin_get`.
```

## openai/gpt-5.6-sol

### Summary

- Baseline completed: true
- Context Goblin completed and validated: true
- Tool use OK: true
- Answer OK: true
- Compatibility result: pass
- Overall efficiency result: pass
- Baseline direct file reads: 17
- Context Goblin built-in file reads: 9
- File-read reduction: 47%
- File-read status: pass
- Input-token reduction: 51%
- Input-token status: pass
- Total-token reduction: 34%
- Total-token status: pass
- Quality score: 6/6
- Quality hits: cartStore.ts, CartDrawer.tsx, catalog product file, tests, risks, safety exclusions
- Required quality hits: save-for-later feature, cart state, cart UI, cart tests
- Quality disqualifiers: none
- Cache size: 2449 bytes
- Secret leakage: none detected
- Baseline errors: 0
- Context Goblin errors: 0

### Baseline

- Duration: 86000ms
- Tool calls: 28
- Input tokens: 16542
- Output tokens: 3214
- Reasoning tokens: 763
- Cache read tokens: 20480
- Total event tokens: 40999
- Cost: 0

Tool counts:

- glob: 8
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
- React with TypeScript and JSX.
- Vite build/dev tooling.
- Vitest for unit tests.
- Zustand is installed but currently unused.
- State is currently held in module-level mutable arrays.
- No persistence, backend cart API, router library, DOM test environment, or component-testing library was found.
- No lockfile was found.

**Commands**
Relevant existing commands from `package.json`:

```sh
npm run dev
npm run build
npm run test -- --run
npm run lint
```

Recommended verification sequence after implementation:

```sh
npm run test -- --run
npm run build
npm run lint
```

No commands were executed because inspection was limited to built-in `read`, `glob`, and `grep` tools.

**Entry Points**
- `src/main.tsx:1` exports `App`; it does not mount React itself.
- `src/App.tsx:3` renders the header and catalog route.
- `src/routes.tsx:3` composes `ProductList` and `CartDrawer`.
- `src/features/catalog/ProductCard.tsx:3` invokes `addToCart`.
- `src/features/cart/CartDrawer.tsx:2` renders current cart items and invokes `removeFromCart`.
- `src/features/cart/cartStore.ts:3` owns the module-level cart state and mutations.
- `tests/cartStore.test.ts:4` is the existing cart behavior test suite.

**Current Behavior**
- `addToCart` adds a line or increments its quantity.
- `removeFromCart` removes the complete line.
- `clearCart` resets cart state.
- The drawer only renders remove buttons; it does not show quantities or totals.
- Store mutations do not notify React. Adding, removing, or saving an item will not reliably update the rendered UI unless some unrelated render occurs.
- `getCartItems` returns the mutable backing array, allowing callers to mutate state without store operations.

**Implementation Plan**
1. Refactor `src/features/cart/cartStore.ts` into reactive Zustand state, using the dependency already present.
2. Define state with `cartItems` and `savedItems`.
3. Keep cart-line data as `Product & { quantity: number }`.
4. Add explicit actions:
   - `addToCart(product)`
   - `removeFromCart(productId)`
   - `saveForLater(productId)`
   - `moveToCart(productId)`
   - `removeSavedItem(productId)`
   - `clearCart()`
5. Make `saveForLater` atomically remove the complete cart line and append it to saved items, preserving quantity.
6. Make `moveToCart` atomically remove the saved line and restore it. If the SKU is already in the cart, merge quantities rather than creating duplicate lines.
7. Update `ProductCard.tsx` to obtain `addToCart` through the reactive store API.
8. Update `CartDrawer.tsx` to subscribe to both collections and actions.
9. Render separate “Cart” and “Saved for later” sections.
10. Add a “Save for later” control beside each cart line and “Move to cart” plus “Remove” controls beside saved lines.
11. Include empty states or omit empty sections consistently; keep native buttons and visible text for accessible interaction.
12. Expand `tests/cartStore.test.ts` around state transitions and isolation. A separate component test should only be added if a DOM test dependency is intentionally introduced.

The preferred scope is limited to:

```text
src/features/cart/cartStore.ts
src/features/cart/CartDrawer.tsx
src/features/catalog/ProductCard.tsx
tests/cartStore.test.ts
```

No route, API, or persistence changes are necessary for an in-memory feature.

**Tests**
Add store tests for:

- Saving removes an item from the cart and adds it to saved items.
- Saved quantity and product fields are preserved.
- Moving a saved item restores it to the cart.
- Moving into an existing cart line merges quantities.
- Removing a saved item does not affect active cart items.
- Removing a cart item does not affect saved items.
- Unknown product IDs are no-ops.
- Repeated save/move operations do not create duplicate lines.
- `clearCart` behavior is explicitly defined and tested.

Recommended `clearCart` semantics: clear active and saved collections for deterministic test/reset behavior. If “clear cart” is user-facing later, separate it into `clearCartItems` and `resetStore`, because users may reasonably expect saved items to survive checkout or cart clearing.

UI coverage would require adding a browser-like test environment and React testing utilities, neither of which currently exists. Without that dependency expansion, use the build/type-check as coverage for component integration and unit-test all transitions at store level.

**Risks**
- The current non-reactive store is the primary implementation risk; simply adding another array and buttons would produce stale UI.
- The meaning of `clearCart` is ambiguous once saved items exist.
- Behavior when adding a catalog product that is already saved must be defined. Recommended behavior is to add one active-cart unit while leaving the saved line unchanged; “Move to cart” remains the explicit operation that transfers saved quantity.
- State is lost on refresh. Persistence should not be added without an explicit product requirement.
- Refactoring exported store functions may affect unknown external consumers, although repository search found only the listed callers and test.
- `Product` is declared in `ProductCard.tsx`, coupling store domain state to a UI module. It could move to a catalog model file, but that is optional scope expansion rather than necessary for this feature.
- The repository lacks a normal Vite `index.html` and React mount call, so `npm run dev` may not produce a runnable page even though component and unit code can compile.
- No lockfile means dependency versions using `latest` are not reproducible.
- Existing lint/build configuration may have baseline issues: no ESLint configuration or React type packages were found.

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

Repository-wide focused searches also checked for cart callers, persistence APIs, Zustand usage, test environments, lockfiles, and additional tests.

**Safety Exclusions**
- Did not read `.env`.
- Did not inspect or alter secrets.
- Did not modify any file.
- Did not run Bash, package scripts, builds, tests, or lint.
- Did not use task agents or subagents.
- Did not plan backend, authentication, checkout, analytics, or persistence changes.
- Did not include unrelated cleanup or dependency upgrades.
```

### Context Goblin

- Duration: 82000ms
- Tool calls: 11
- context_goblin_get: yes
- context_goblin_status: no
- context_goblin_refresh: no
- context_goblin_read: no
- Input tokens: 8051
- Output tokens: 1777
- Reasoning tokens: 1612
- Cache read tokens: 15616
- Total event tokens: 27056
- Cost: 0

Tool counts:

- context_goblin_get: 1
- glob: 1
- read: 9

Files read:

- AGENTS.md
- package.json
- src/components/Button.tsx
- src/features/cart/CartDrawer.tsx
- src/features/cart/cartStore.ts
- src/features/catalog/ProductCard.tsx
- src/routes.tsx
- src/styles/theme.css
- tests/cartStore.test.ts

Errors:

- none

Final answer:

```txt
**Stack**
- TypeScript, React, Vite, Node.js
- State dependency available: Zustand
- Tests: Vitest
- Lint: ESLint
- Package manager is not declared; no root lockfile was found. Commands below assume npm.

**Commands**
- Development: `npm run dev`
- Build/type-check: `npm run build`
- Tests once: `npm test -- --run`
- Cart tests: `npm test -- --run tests/cartStore.test.ts`
- Lint: `npm run lint`

No commands were executed.

**Entry Points**
- Application: `src/main.tsx`
- App shell: `src/App.tsx`
- Route composition: `src/routes.tsx`
- Cart UI: `src/features/cart/CartDrawer.tsx`
- Cart state/actions: `src/features/cart/cartStore.ts`
- Add-to-cart integration: `src/features/catalog/ProductCard.tsx`

**Files Inspected**
- `AGENTS.md`
- `package.json`
- `src/components/Button.tsx`
- `src/features/cart/CartDrawer.tsx`
- `src/features/cart/cartStore.ts`
- `src/features/catalog/ProductCard.tsx`
- `src/routes.tsx`
- `src/styles/theme.css`
- `tests/cartStore.test.ts`

A focused lockfile glob found no root package-manager lockfile.

**Recommended Files**
- Modify `src/features/cart/cartStore.ts`
- Modify `src/features/cart/CartDrawer.tsx`
- Expand `tests/cartStore.test.ts`
- Modify `src/features/catalog/ProductCard.tsx` only if the existing imperative `addToCart` API is replaced rather than preserved
- Avoid adding new files unless saved-item presentation grows enough to justify a component

**Implementation Plan**
1. Convert the module-level mutable array in `cartStore.ts` into a reactive Zustand store. The current mutations do not trigger `CartDrawer` rerenders.
2. Keep separate `items` and `savedItems` collections of `CartItem`, preserving quantity when an item moves between them.
3. Add `saveForLater(productId)`, `moveToCart(productId)`, and `removeSavedItem(productId)` actions.
4. Make moves atomic and immutable. Remove the source item and merge quantities when the destination already contains the same product ID.
5. Keep `clearCart()` scoped to active cart items. Add a distinct saved-items clearing/reset mechanism so “saved for later” does not disappear when the cart is cleared.
6. Preserve existing `addToCart`, `removeFromCart`, and getter exports as thin Zustand-backed functions if minimizing call-site changes is preferred.
7. Update `CartDrawer` to subscribe to reactive selectors and render two semantic sections: “Cart” and “Saved for later.”
8. Add “Save for later” beside each active item, plus “Move to cart” and “Remove” controls for saved items.
9. Reuse `src/components/Button.tsx` where practical. No theme expansion is required for functional scope because the current design system contains no substantive button styling.
10. Run targeted tests, then the full test, build, and lint commands.

**Tests**
Add store tests covering:

- Saving removes an item from the active cart and adds it to saved items.
- Quantity is preserved when saving.
- Moving a saved item back restores it to the cart.
- Moving into an existing cart entry merges quantities.
- Saving into an existing saved entry merges quantities.
- Removing a saved item does not affect active cart items.
- Unknown product IDs are harmless no-ops.
- `clearCart()` leaves saved items intact.
- Test setup clears both collections to prevent state leakage.
- Existing add/remove behavior remains valid.

A component interaction test would require adding React DOM test tooling not currently declared. Store-level Vitest coverage is the minimal appropriate test scope.

**Risks**
- Persistence is absent. Saved items will be lost on refresh unless local storage or an API is explicitly added.
- “Save for later” quantity semantics need product confirmation; this plan moves the entire line item rather than one unit.
- The current store imports `Product` from a UI component. It works as a type-only import, but shared catalog models should eventually live outside `ProductCard.tsx`.
- Zustand is installed but currently unused, so the conversion affects the cart’s state architecture.
- Dependencies use `latest` versions and there is no root lockfile, making reproducible verification less reliable.
- Accessibility labels and empty-state text should distinguish cart removal, saving, and saved-item removal.

**Safety Exclusions**
Not read or recommended for inspection:

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
