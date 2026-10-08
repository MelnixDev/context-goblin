# General Model Context Goblin A/B Report

Generated: 2026-10-08T13:14:10.746Z
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
| openai/gpt-5.5 | yes | yes | yes | 16 | 6 | 63% | 25% | 27% | 6/6 | 2449 | pass | pass | pass |
| openai/gpt-5.6-sol | yes | yes | yes | 17 | 11 | 35% | 19% | 31% | 6/6 | 2449 | pass | pass | pass |

## openai/gpt-5.5

### Summary

- Baseline completed: true
- Context Goblin completed and validated: true
- Tool use OK: true
- Answer OK: true
- Compatibility result: pass
- Overall efficiency result: pass
- Baseline direct file reads: 16
- Context Goblin built-in file reads: 6
- File-read reduction: 63%
- File-read status: pass
- Input-token reduction: 25%
- Input-token status: pass
- Total-token reduction: 27%
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

- Duration: 31000ms
- Tool calls: 21
- Input tokens: 12001
- Output tokens: 2295
- Reasoning tokens: 186
- Cache read tokens: 21504
- Total event tokens: 35986
- Cost: 0

Tool counts:

- glob: 4
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
- React + TypeScript + Vite
- Tests: Vitest
- State: current cart state is a module-level array in `src/features/cart/cartStore.ts`
- Dependency note: `zustand` is installed but not currently used by cart code

**Available Commands**
- `npm run dev`: starts Vite
- `npm run build`: runs `tsc && vite build`
- `npm test`: runs Vitest
- `npm run lint`: runs ESLint on `src`

**Entry Points**
- App root: `src/App.tsx`
- Route composition: `src/routes.tsx`
- Catalog UI: `src/features/catalog/ProductList.tsx`
- Product add action: `src/features/catalog/ProductCard.tsx`
- Cart UI: `src/features/cart/CartDrawer.tsx`
- Cart behavior/state: `src/features/cart/cartStore.ts`
- Cart tests: `tests/cartStore.test.ts`

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
- `src/styles/theme.css`
- `src/features/cart/cartStore.ts`
- `src/features/cart/CartDrawer.tsx`
- `src/features/catalog/ProductCard.tsx`
- `src/features/catalog/ProductList.tsx`
- `tests/cartStore.test.ts`

**Searches Performed**
- `glob("*")`
- `glob("**/package.json")`
- `glob("**/*cart*")`
- `glob("**/*Cart*")`
- `grep("addToCart|removeFromCart|getCartItems|clearCart|CartDrawer|ProductCard|ProductList", include="*.{ts,tsx}")`

**Implementation Plan**
1. Extend `src/features/cart/cartStore.ts` with a second module-level collection, likely `savedItems: Product[]` or `SavedItem[]`.
2. Add cart-store functions:
   - `saveForLater(productId: string)`: move an item from `items` to saved list and remove it from active cart.
   - `moveToCart(productId: string)`: move a saved item back to cart, preserving existing `addToCart` quantity behavior.
   - `removeSavedItem(productId: string)`: remove from saved list.
   - `getSavedItems()`: expose saved list.
   - Update `clearCart()` to clear both active cart and saved items for test isolation.
3. Update `src/features/cart/CartDrawer.tsx`:
   - Import new functions.
   - Render active cart items with both `Remove` and `Save for later` actions.
   - Render a saved-for-later section with `Move to cart` and optionally `Remove`.
4. Add tests in `tests/cartStore.test.ts`:
   - Saving an item removes it from cart and adds it to saved items.
   - Moving a saved item back returns it to cart and removes it from saved items.
   - Saving preserves enough product data to re-add to cart.
   - `clearCart()` resets both lists.
   - Optional: saving the same product twice does not duplicate saved entries.
5. Keep implementation minimal and consistent with current style unless the feature scope explicitly requires reactive UI updates.

**Risks**
- Current cart store is not reactive. `CartDrawer` calls `getCartItems()` during render, but store mutations do not trigger React re-renders by themselves. Existing behavior already has this issue; “Save for later” would inherit it unless state is moved into React/Zustand.
- `getCartItems()` currently returns the mutable backing array. Callers could mutate store state externally. A safer change would return copies, but that may be outside the smallest feature change.
- Quantity semantics need a product decision: saving one line item currently implies saving the whole cart item with its quantity, but a saved-for-later list usually may or may not preserve quantity.
- `clearCart()` currently only clears active cart. Tests should define whether saved items are also cleared.
- UI is extremely minimal, so adding sections/buttons may be functionally correct but visually bare.

**Tests**
- Primary test file: `tests/cartStore.test.ts`
- Recommended command: `npm test`
- Recommended verification after implementation: `npm run build`
- Optional: `npm run lint`, though the ESLint setup may be incomplete because only `eslint` is listed without visible config.

**Safety Exclusions**
- Did not read `.env`; it exists but was intentionally excluded.
- Did not modify files.
- Did not run bash or package-manager commands.
- Did not use task/subagents.
- Used only built-in `read`, `glob`, and `grep` tools for inspection.
```

### Context Goblin

- Duration: 37000ms
- Tool calls: 11
- context_goblin_get: yes
- context_goblin_status: no
- context_goblin_refresh: no
- context_goblin_read: no
- Input tokens: 8973
- Output tokens: 1828
- Reasoning tokens: 654
- Cache read tokens: 14848
- Total event tokens: 26303
- Cost: 0

Tool counts:

- context_goblin_get: 1
- glob: 3
- grep: 1
- read: 6

Files read:

- package.json
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
- TypeScript
- React
- Vite
- Node.js
- Dependency present: `zustand`, but current cart store does not use it.
- Package manager: no root `package-lock.json`, `pnpm-lock.yaml`, or `yarn.lock` found, so package manager is not identifiable from inspected files.

**Commands**
- `npm run dev` maps to `vite`
- `npm run build` maps to `tsc && vite build`
- `npm test` or `npm run test` maps to `vitest`
- `npm run lint` maps to `eslint src --ext ts,tsx`

**Entry Points**
- App entry: `src/main.tsx`
- App shell: `src/App.tsx`
- Route composition: `src/routes.tsx`
- Cart UI entry: `src/features/cart/CartDrawer.tsx`
- Catalog add-to-cart entry: `src/features/catalog/ProductCard.tsx`
- Cart state: `src/features/cart/cartStore.ts`

**Files Inspected**
- Context Goblin cache only via `context_goblin_get`
- `package.json`
- `src/features/cart/cartStore.ts`
- `src/features/cart/CartDrawer.tsx`
- `src/features/catalog/ProductCard.tsx`
- `src/routes.tsx`
- `tests/cartStore.test.ts`

**Recommended Files To Change**
- `src/features/cart/cartStore.ts`
- `src/features/cart/CartDrawer.tsx`
- `tests/cartStore.test.ts`

Optional only if styling is desired:
- `src/styles/theme.css`

**Implementation Plan**
1. Extend `src/features/cart/cartStore.ts` with a separate module-level `savedItems: Product[]`.
2. Add store functions:
   - `saveForLater(productId: string)`: find the cart item, remove it from `items`, and add/update it in `savedItems`.
   - `moveSavedToCart(productId: string)`: find saved product, remove it from `savedItems`, and call `addToCart`.
   - `removeSavedItem(productId: string)`: remove a saved item permanently.
   - `getSavedItems()`: return saved items.
   - `clearCart()`: also clear `savedItems`, or add a separate `clearSavedItems()` if tests need independent control.
3. Add a small subscription mechanism in `cartStore.ts` so UI re-renders when `addToCart`, `removeFromCart`, `saveForLater`, or `moveSavedToCart` changes state.
4. Update `CartDrawer.tsx` to render two sections:
   - Cart items with `Remove` and `Save for later`.
   - Saved-for-later items with `Move to cart` and optionally `Remove`.
5. Keep `ProductCard.tsx` unchanged unless product cards should show saved state.
6. Add cart behavior tests in `tests/cartStore.test.ts`:
   - saving an item removes it from cart
   - saving an item adds it to saved-for-later
   - moving a saved item back adds it to cart
   - removing a saved item deletes only the saved entry
   - duplicate saves do not create duplicate saved entries

**Risks**
- Current cart state is a plain module-level array, so React components may not re-render reliably after mutations. A subscription or store hook is needed for a correct UI.
- `getCartItems()` currently returns the internal array directly. Tests or callers could mutate it accidentally. Consider returning copies if tightening behavior.
- Cart item quantity semantics need a product decision: saving one item with quantity `3` could save the whole cart line or only decrement one unit. Minimal plan: save the whole cart line.
- No persistence exists today. “Save for later” would be in-memory only unless localStorage/API persistence is explicitly required.
- `CartDrawer.tsx` is currently very compact; adding this feature may make it worth formatting into a normal multi-line component.

**Tests**
- Primary: `npm test`
- Build/typecheck: `npm run build`
- Lint: `npm run lint`
- Add tests to `tests/cartStore.test.ts` because project instructions prefer tests for cart behavior changes.

**Safety Exclusions**
- Did not read `.env`.
- Did not modify files.
- Context Goblin denied paths include `.env`, `.env.*`, `*.pem`, `*.key`, `secrets.json`, `credentials.json`, `node_modules/**`, `.git/**`, `dist/**`, `build/**`, `coverage/**`, `.next/**`, `.nuxt/**`, `.output/**`, and `.opencode/cache/context-goblin/**`.
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
- Context Goblin built-in file reads: 11
- File-read reduction: 35%
- File-read status: pass
- Input-token reduction: 19%
- Input-token status: pass
- Total-token reduction: 31%
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

- Duration: 77000ms
- Tool calls: 25
- Input tokens: 11148
- Output tokens: 3026
- Reasoning tokens: 1165
- Cache read tokens: 24832
- Total event tokens: 40171
- Cost: 0

Tool counts:

- glob: 3
- grep: 2
- read: 20

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
- Vitest for tests.
- ESLint for source linting.
- Zustand is installed but unused.
- No router library, persistence layer, backend cart API, or component-test framework.
- Package versions use `latest`; no lockfile was found.

**Entry Points**
- `src/main.tsx`: exports `App`; it does not mount with `createRoot`.
- `src/App.tsx`: renders `Header` and `routes.catalog`.
- `src/routes.tsx`: composes `ProductList` and `CartDrawer`.
- `src/features/catalog/ProductCard.tsx`: calls `addToCart`.
- `src/features/cart/CartDrawer.tsx`: reads cart items and exposes removal.
- `src/features/cart/cartStore.ts`: module-level in-memory cart state and all cart operations.
- `tests/cartStore.test.ts`: existing cart behavior coverage.

Current flow:

```text
ProductCard -> addToCart -> module-level items[]
CartDrawer -> getCartItems / removeFromCart
```

The store is not reactive. Cart mutations do not notify React, so adding, removing, saving, or restoring items will not reliably rerender `CartDrawer`.

**Implementation Plan**
1. Update `src/features/cart/cartStore.ts`.
   - Add a second in-memory `savedItems: CartItem[]` collection.
   - Add `saveForLater(productId)`, `moveToCart(productId)`, `getSavedItems()`, and optionally `removeFromSaved(productId)`.
   - Move complete line items, preserving quantity.
   - Merge quantities when moving into a collection that already contains the same product.
   - Treat unknown IDs as no-ops.
   - Use immutable array updates so snapshots change identity.
   - Add a small subscribe/notify mechanism suitable for React’s `useSyncExternalStore`.
   - Keep `clearCart()` scoped to active cart items; add `clearSavedItems()` or a test-only-neutral `clearAll()` to prevent test leakage.

2. Update `src/features/cart/CartDrawer.tsx`.
   - Subscribe to store changes with `useSyncExternalStore`.
   - Render active cart items with both `Remove` and `Save for later` actions.
   - Render a labeled “Saved for later” section.
   - Give saved items `Move to cart` and, if included in scope, `Remove` actions.
   - Use semantic headings/lists and explicit button labels.

3. Expand `tests/cartStore.test.ts`.
   - Reset both active and saved collections before every test.
   - Verify saving removes the active line and preserves its quantity.
   - Verify moving back removes the saved line and restores its quantity.
   - Verify quantities merge when the destination already contains that SKU.
   - Verify unknown IDs do nothing.
   - Verify removing a saved item if that operation is added.
   - Verify subscribers are notified for relevant mutations.

4. Avoid moving `Product` or broadly restructuring the feature.
   - Its current location is imperfect, but relocating it is unrelated to the feature.
   - Do not convert the store to Zustand merely because the dependency exists; a small subscription layer is the lower-risk change.

5. Validate with the existing scripts.
   - Run focused tests first, then the full checks.
   - Manually verify cart-to-saved and saved-to-cart transitions in the browser.

**Commands**
Recommended commands; none were executed because inspection was restricted to read/glob/grep tools:

```sh
npm test -- --run tests/cartStore.test.ts
npm test -- --run
npm run build
npm run lint
npm run dev
```

Dependency installation, if needed:

```sh
npm install
```

Running `npm install` may create a lockfile because none currently exists.

**Risks**
- The current non-reactive store is the main implementation risk. Adding saved state without subscriptions would produce stale UI.
- `getCartItems()` currently returns the mutable internal array. External mutation is possible; snapshots should be exposed read-only or as immutable state.
- `addToCart()` mutates quantities in place, which is incompatible with identity-based React snapshots.
- Semantics for adding a catalog product that is already saved are unspecified. Recommended behavior: leave the saved line untouched and create/increment an active line; only “Move to cart” transfers the saved quantity.
- Semantics for `clearCart()` are ambiguous. Preserving saved items is most consistent with the method name, but tests must explicitly clear saved state.
- Everything is memory-only and disappears on reload.
- There is only one catalog SKU, making manual duplicate/merge scenarios difficult without changing fixture data.
- There is no React Testing Library or browser-test setup. Store behavior can be covered now, but rendered interaction tests would require new test dependencies/configuration.
- `src/main.tsx` does not actually mount the application, so `npm run dev` may not present a usable page depending on omitted fixture infrastructure.
- Unpinned `latest` dependencies and absence of a lockfile can make installation/build results nondeterministic.

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
- `src/features/catalog/ProductCard.tsx`
- `src/features/catalog/ProductList.tsx`
- `src/features/cart/cartStore.ts`
- `src/features/cart/CartDrawer.tsx`
- `src/styles/theme.css`
- `tests/cartStore.test.ts`

Repository, `src/`, and `tests/` directory listings were also inspected. Filename and content searches covered `src`, tests, and top-level project metadata.

**Safety Exclusions**
- `.env` was not read or searched.
- `opencode.json` was not read because it is unrelated to the application feature.
- No files were modified or created.
- No shell, task/subagent, network, package-install, test, build, lint, or development-server commands were run.
- No persistence, API, authentication, checkout, pricing, or unrelated catalog changes are proposed.
```

### Context Goblin

- Duration: 57000ms
- Tool calls: 14
- context_goblin_get: yes
- context_goblin_status: no
- context_goblin_refresh: no
- context_goblin_read: no
- Input tokens: 9034
- Output tokens: 2208
- Reasoning tokens: 761
- Cache read tokens: 15872
- Total event tokens: 27875
- Cost: 0

Tool counts:

- context_goblin_get: 1
- grep: 2
- read: 11

Files read:

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

Errors:

- none

Final answer:

```txt
**Stack**
- TypeScript
- React with Vite
- Zustand installed but currently unused
- Vitest
- ESLint
- Package manager is not identifiable from the root; no root lockfile was listed. `.opencode/package-lock.json` belongs to tooling, not the app.

**Commands**
- Development: `npm run dev`
- Tests: `npm test`
- One test file: `npm test -- tests/cartStore.test.ts`
- Build/type-check: `npm run build`
- Lint: `npm run lint`

These use npm syntax as an example; the scripts themselves are package-manager agnostic.

**Entry Points**
- `src/main.tsx`: exports `App`; it does not mount React directly.
- `src/App.tsx`: renders `Header` and the catalog route.
- `src/routes.tsx`: composes `ProductList` and `CartDrawer`.
- Cart mutations enter through `ProductCard` and `CartDrawer`.
- State is held in the module-level array in `src/features/cart/cartStore.ts`.

**Recommended Implementation**
1. Replace the non-reactive module array in `src/features/cart/cartStore.ts` with a Zustand store containing:
   - `items: CartItem[]`
   - `savedItems: CartItem[]`
   - `addToCart(product)`
   - `removeFromCart(productId)`
   - `saveForLater(productId)`
   - `moveToCart(productId)`
   - `removeSavedItem(productId)`
   - `clearCart()` that resets both collections for deterministic tests
2. Keep cart and saved collections disjoint.
3. Have `saveForLater` atomically remove the item from `items` and append it to `savedItems`, preserving quantity.
4. Have `moveToCart` atomically remove the saved item and return it to the cart. If an active item with the same ID exists, merge quantities rather than creating duplicates.
5. Update `src/features/catalog/ProductCard.tsx` to invoke the subscribed Zustand action rather than the current standalone mutator.
6. Update `src/features/cart/CartDrawer.tsx` to subscribe to both collections. Render:
   - A “Save for later” button for each active item.
   - A clearly labelled “Saved for later” section.
   - “Move to cart” and “Remove” controls for each saved item.
   - Empty states or omit empty sections, depending on desired UX.
7. Prefer the existing native-button style unless broader visual work is requested. `Button.tsx` currently adds no behavior or styling.
8. Do not add browser persistence in the initial implementation. No existing `localStorage`, session storage, backend cart API, or persistence convention was found.

**Files To Modify**
- `src/features/cart/cartStore.ts`
- `src/features/cart/CartDrawer.tsx`
- `src/features/catalog/ProductCard.tsx`
- `tests/cartStore.test.ts`

No new file is required for the smallest correct implementation.

**Test Plan**
Add cart behavior tests to `tests/cartStore.test.ts` for:

- Saving removes an item from the active cart.
- Saving adds the same item to the saved collection.
- Saved quantity is preserved.
- Moving a saved item returns it to the active cart.
- Moving removes it from the saved collection.
- Moving merges quantities if the product already exists in the cart.
- Removing a saved item does not affect active items.
- Unknown product IDs are no-ops.
- Repeated save/move operations do not create duplicates.
- `clearCart` resets active and saved items.
- Existing add/remove behavior remains intact.

Component tests would be useful for rerender and button behavior, but the repository currently has no React component-test dependencies or setup. Avoid adding that infrastructure unless UI-level coverage is required.

**Risks**
- The current store is not reactive. Merely adding another module array would leave the drawer stale after button clicks; adopting the already-installed Zustand dependency addresses this.
- The intended meaning of `clearCart` is ambiguous. For test isolation, resetting both lists is recommended; production semantics may eventually need separate `clearCart` and `clearSavedItems`.
- Adding a product from the catalog while it is saved needs a defined rule. Recommended behavior is to remove it from saved and add/merge it into the active cart so the two lists remain disjoint.
- Saved-item persistence across reloads or authenticated sessions is unspecified. Adding persistence now could establish an accidental data contract.
- `Product` is declared in a UI component and imported by the store. This type-only dependency works, but moving it to a domain types file should be deferred unless the product model grows.
- `src/main.tsx` only exports `App`; the actual browser mount may be supplied externally by this fixture.

**Exact Files Inspected**
- `package.json`
- `src/main.tsx`
- `src/App.tsx`
- `src/routes.tsx`
- `src/components/Button.tsx`
- `src/styles/theme.css`
- `src/features/cart/cartStore.ts`
- `src/features/cart/CartDrawer.tsx`
- `src/features/catalog/ProductCard.tsx`
- `src/features/catalog/ProductList.tsx`
- `tests/cartStore.test.ts`

A focused grep also confirmed all cart-store call sites and found no storage/persistence use under `src`.

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

No files were modified.
```
