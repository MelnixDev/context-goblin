# Context Goblin Token Usage A/B Report

Generated: 2026-09-04T18:52:17.447Z
OpenCode version: 1.18.20
Context Goblin version: 0.1.21
Model group: custom

## Task

Measure token usage while planning where and how to add a "Save for later" feature to a realistic React/Vite cart and catalog app. The model must not modify files or read .env.

## Protocol

- Each arm receives a fresh copy of the same synthetic fixture.
- The `task`, `bash`, and `edit` tools are explicitly denied so repository reads remain visible and comparable in the parent OpenCode event stream.
- Models may use direct `read`, `glob`, and `grep` tools; the Context Goblin arm may additionally use Context Goblin tools.
- Results are one run per model and arm. Model behavior and provider token accounting can vary between runs.
- Compatibility passes only when both arms complete, required Goblin tools and cache safety checks pass, and answer quality is sufficient.
- Overall efficiency passes only when file reads, uncached input tokens, and total event tokens all improve. Any regression fails; `mixed` is reserved for non-regressing but flat or unavailable evidence.

## Summary

| Model | Baseline Input | Goblin Input | Input Saved | Input Status | Baseline Total | Goblin Total | Total Saved | Total Status | Baseline Reads | Goblin Reads | File Saved | File Status | Cache Size | Token Result |
| --- | ---: | ---: | ---: | --- | ---: | ---: | ---: | --- | ---: | ---: | ---: | --- | ---: | --- |
| openai/gpt-5.5 | 13145 | 9530 | 28% | pass | 48093 | 25356 | 47% | pass | 16 | 9 | 44% | pass | 2587 | pass |
| openai/gpt-5.6-sol | 11840 | 6496 | 45% | pass | 41531 | 27056 | 35% | pass | 17 | 11 | 35% | pass | 2587 | pass |

## openai/gpt-5.5

### Summary

- Baseline completed: true
- Context Goblin completed and validated: true
- Tool use OK: true
- Answer OK: true
- Compatibility result: pass
- Overall efficiency result: pass
- Baseline direct file reads: 16
- Context Goblin built-in file reads: 9
- File-read reduction: 44%
- File-read status: pass
- Input-token reduction: 28%
- Input-token status: pass
- Total-token reduction: 47%
- Total-token status: pass
- Quality score: 6/6
- Quality hits: cartStore.ts, CartDrawer.tsx, catalog product file, tests, risks, safety exclusions
- Required quality hits: save-for-later feature, cart state, cart UI, cart tests
- Quality disqualifiers: none
- Cache size: 2587 bytes
- Secret leakage: none detected
- Baseline errors: 0
- Context Goblin errors: 0

### Baseline

- Duration: 62000ms
- Tool calls: 21
- Input tokens: 13145
- Output tokens: 2524
- Reasoning tokens: 168
- Cache read tokens: 32256
- Total event tokens: 48093
- Cost: 0

Tool counts:

- glob: 3
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
React + Vite + TypeScript, tested with Vitest. Cart state is currently an in-memory module in `src/features/cart/cartStore.ts`, not Zustand despite `zustand` being listed in `package.json`.

**Inspection Commands**
Used only built-in `glob`, `grep`, and `read` tools. No bash, task/subagents, edits, or `.env` reads.

Inspected via:
`glob **/*`
`glob **/package.json`
`glob **/*.{test,spec}.{ts,tsx,js,jsx}`
`grep cart|Cart|checkout|Checkout`
`grep save|saved|later|wishlist|wish|CartItem|Product`
`read <focused files>`

**Project Commands**
Available scripts from `package.json`:
`npm run dev`
`npm run build`
`npm test`
`npm run lint`

**Entry Points**
`src/App.tsx`: renders `Header` and `routes.catalog`.
`src/routes.tsx`: renders `ProductList` and `CartDrawer`.
`src/features/catalog/ProductCard.tsx`: calls `addToCart(product)`.
`src/features/cart/CartDrawer.tsx`: displays cart items and removes them.
`src/features/cart/cartStore.ts`: owns cart data and behavior.
`tests/cartStore.test.ts`: existing cart behavior test location.

**Exact Files Inspected**
`AGENTS.md`
`README.md`
`package.json`
`tsconfig.json`
`vite.config.ts`
`src/App.tsx`
`src/main.tsx`
`src/routes.tsx`
`src/api/client.ts`
`src/components/Button.tsx`
`src/components/Header.tsx`
`src/styles/theme.css`
`src/features/cart/cartStore.ts`
`src/features/cart/CartDrawer.tsx`
`src/features/catalog/ProductCard.tsx`
`src/features/catalog/ProductList.tsx`
`tests/cartStore.test.ts`

**Implementation Plan**
1. Extend `src/features/cart/cartStore.ts` with a separate saved-for-later collection:
   - Add `let savedItems: Product[] = []`.
   - Add `saveForLater(productId: string)` that finds a cart item, removes it from `items`, and stores one product record in `savedItems`.
   - Add `moveToCart(productId: string)` that finds a saved item, removes it from `savedItems`, and calls `addToCart`.
   - Add `removeFromSaved(productId: string)` if UI needs deletion from saved list.
   - Add `getSavedItems()`.
   - Update `clearCart()` to reset both cart and saved items for test isolation.

2. Update `src/features/cart/CartDrawer.tsx`:
   - Import `getSavedItems`, `saveForLater`, and optionally `moveToCart` / `removeFromSaved`.
   - Render cart items with both `Remove` and `Save for later` actions.
   - Render a saved-for-later section below the cart.
   - Add `Move to cart` for saved items if the desired behavior includes restoring items.

3. Keep catalog code unchanged:
   - `ProductCard.tsx` should continue adding products to the active cart only.
   - No route changes appear necessary because `CartDrawer` already renders with the catalog route.

4. Add/extend tests in `tests/cartStore.test.ts`:
   - Verify saving an item removes it from cart.
   - Verify saved item appears in `getSavedItems()`.
   - Verify moving a saved item back to cart removes it from saved items.
   - Verify quantity behavior is preserved when saving duplicate cart items.
   - Verify `clearCart()` resets both active and saved collections.

**Risks**
`CartDrawer` calls plain module functions, so mutations may not trigger React re-render in a real mounted app unless some parent re-renders. Existing code already has this limitation for remove/add behavior.
`getCartItems()` currently returns the mutable backing array, so tests or UI could mutate store state accidentally.
Saving a cart item with `quantity > 1` needs a product decision: save the whole line item, save one unit, or save product metadata without quantity.
No persistence exists, so saved-for-later items disappear on reload.
`main.tsx` exports `App` but does not mount React, suggesting this is a fixture rather than a complete running app.

**Tests**
Recommended verification:
`npm test`
`npm run build`
`npm run lint`

Primary test file to update:
`tests/cartStore.test.ts`

**Safety Exclusions**
Did not read `.env`.
Did not modify files.
Did not use bash.
Did not use task/subagents.
Did not inspect dependency internals or generated folders.
```

### Context Goblin

- Duration: 50000ms
- Tool calls: 10
- context_goblin_get: yes
- context_goblin_status: no
- context_goblin_refresh: no
- context_goblin_read: no
- Input tokens: 9530
- Output tokens: 1901
- Reasoning tokens: 101
- Cache read tokens: 13824
- Total event tokens: 25356
- Cost: 0

Tool counts:

- context_goblin_get: 1
- read: 9

Files read:

- package.json
- src/App.tsx
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
- TypeScript
- React
- Vite
- Vitest
- Zustand is installed, but current cart state does not use it

**Commands**
- Dev: `vite`
- Build: `tsc && vite build`
- Test: `vitest`
- Lint: `eslint src --ext ts,tsx`

**Entry Points**
- App entry: `src/main.tsx`
- App shell: `src/App.tsx`
- Route composition: `src/routes.tsx`
- Catalog UI: `src/features/catalog/ProductList.tsx`
- Add-to-cart action: `src/features/catalog/ProductCard.tsx`
- Cart UI: `src/features/cart/CartDrawer.tsx`
- Cart state: `src/features/cart/cartStore.ts`

**Files Inspected**
- `package.json`
- `src/features/cart/cartStore.ts`
- `src/features/cart/CartDrawer.tsx`
- `src/features/catalog/ProductCard.tsx`
- `src/features/catalog/ProductList.tsx`
- `src/routes.tsx`
- `src/App.tsx`
- `src/components/Button.tsx`
- `tests/cartStore.test.ts`

**Recommended Files To Change**
- `src/features/cart/cartStore.ts`
- `src/features/cart/CartDrawer.tsx`
- `tests/cartStore.test.ts`

Optional, only if a catalog-level restore/add interaction is desired:
- `src/features/catalog/ProductCard.tsx`

**Implementation Plan**
1. Extend `src/features/cart/cartStore.ts` with a second module-level array, likely `savedItems: Product[]` or `SavedItem[]`.
2. Add exports:
   - `saveForLater(productId: string)`: find item in `items`, remove it from cart, add it to saved list if not already saved.
   - `moveSavedToCart(productId: string)`: find saved item, remove it from saved list, call `addToCart`.
   - `removeSavedItem(productId: string)`: remove from saved list only.
   - `getSavedItems()`: return saved list.
3. Update `clearCart()` behavior carefully:
   - For test isolation, either keep `clearCart()` clearing only cart and add `clearSavedItems()`, or make it clear both if it is intended as a full store reset.
   - Best minimal approach: add `clearSavedItems()` and update tests’ `beforeEach` to call both.
4. Update `src/features/cart/CartDrawer.tsx`:
   - Import `saveForLater`, `getSavedItems`, `moveSavedToCart`, and optionally `removeSavedItem`.
   - For each cart item, render both `Remove {item.name}` and `Save for later {item.name}`.
   - Render a saved-for-later section below cart items.
   - For each saved item, render `Move to cart {item.name}` and optionally `Remove saved {item.name}`.
5. Add tests in `tests/cartStore.test.ts`:
   - Saving an item removes it from cart and adds it to saved items.
   - Saving the same product twice does not duplicate saved entries.
   - Moving saved item to cart removes it from saved list and restores it to cart.
   - Removing from cart still does not affect saved items unless explicitly intended.
   - Reset helper clears both arrays between tests.

**Behavioral Shape**
- Cart item type can stay `CartItem extends Product { quantity: number }`.
- Saved item type should probably be plain `Product`, because quantity in cart should not necessarily persist while saved unless product requirements say otherwise.
- If saving a cart item with `quantity > 1`, define expected behavior before implementation:
  - Minimal likely behavior: saving removes the entire cart line and saves one product reference.
  - Alternative: persist quantity in saved items and restore the same quantity later.

**Risks**
- Current state is module-level and not reactive; `CartDrawer` may not re-render after save/remove unless something else triggers render. This is already a risk with the existing `addToCart`/`removeFromCart` implementation.
- Zustand is installed but unused. A more correct React implementation would likely migrate `cartStore.ts` to a reactive Zustand store, but that is a larger change.
- `getCartItems()` currently returns the mutable backing array. Tests or UI could mutate it accidentally. Same risk would apply to `getSavedItems()` unless it returns a copy.
- Persisted storage is absent. Saved-for-later items would be lost on page refresh unless local storage/API persistence is added.
- Quantity semantics need a product decision for “save for later” on multi-quantity cart lines.

**Tests**
- Run: `vitest`
- Run: `tsc && vite build`
- Optional lint check: `eslint src --ext ts,tsx`

**Safety Exclusions**
- Did not read or modify `.env`.
- Did not modify any files.
- Excluded by Context Goblin cache:
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
- Input-token reduction: 45%
- Input-token status: pass
- Total-token reduction: 35%
- Total-token status: pass
- Quality score: 6/6
- Quality hits: cartStore.ts, CartDrawer.tsx, catalog product file, tests, risks, safety exclusions
- Required quality hits: save-for-later feature, cart state, cart UI, cart tests
- Quality disqualifiers: none
- Cache size: 2587 bytes
- Secret leakage: none detected
- Baseline errors: 0
- Context Goblin errors: 0

### Baseline

- Duration: 83000ms
- Tool calls: 30
- Input tokens: 11840
- Output tokens: 3185
- Reasoning tokens: 650
- Cache read tokens: 25856
- Total event tokens: 41531
- Cost: 0

Tool counts:

- glob: 9
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
**Repository Assessment**

The repository is a minimal React/Vite/TypeScript fixture. The cart is synchronous, module-scoped, and non-reactive. Adding or removing an item mutates state, but mounted components are not notified to rerender.

**Stack**

- React and React DOM, version `latest`
- TypeScript with strict mode
- Vite
- Vitest
- Zustand installed but currently unused
- ESLint
- No router library; `src/routes.tsx` contains a static element map
- No persistence layer
- No component-testing library
- No lockfile found
- No browser entry/bootstrap or `index.html` found; `src/main.tsx` only re-exports `App`

**Commands**

From `package.json`:

- Development: `npm run dev`
- Production build/type-check: `npm run build`
- Tests in watch mode: `npm test`
- One-shot tests: `npm test -- --run`
- Lint: `npm run lint`

No commands were executed because the request allowed only read, glob, and grep tools.

**Entry Points**

- Application export: `src/main.tsx:1`
- Root component: `src/App.tsx:3`
- Catalog/cart composition: `src/routes.tsx:3`
- Product-to-cart action: `src/features/catalog/ProductCard.tsx:3`
- Cart UI: `src/features/cart/CartDrawer.tsx:2`
- Cart state and operations: `src/features/cart/cartStore.ts:1`
- Existing cart tests: `tests/cartStore.test.ts:1`

**Current Cart Flow**

- `ProductCard` calls `addToCart(product)`.
- `cartStore.ts` stores `CartItem[]` in module scope.
- Repeated additions increment `quantity`.
- `CartDrawer` calls `getCartItems()` during render.
- Cart removal calls `removeFromCart(item.id)`.
- No subscription triggers React updates after mutations.
- `clearCart()` is primarily used for test isolation.
- Quantity and price are not displayed in the drawer.

**Implementation Plan**

1. Refactor `src/features/cart/cartStore.ts` into a reactive Zustand store while keeping cart behavior centralized.
2. Represent state with two collections:
   - Active cart items
   - Saved-for-later items
3. Add operations:
   - `saveForLater(productId)` moves an active line to saved items.
   - `moveToCart(productId)` moves a saved line back to the active cart.
   - `removeSavedItem(productId)` permanently removes a saved item.
   - `clearCart()` resets both collections for deterministic tests.
4. Preserve quantity when saving and restoring.
5. If restoring a SKU already present in the cart, merge quantities rather than creating duplicate active lines.
6. Keep saved and active entries distinct while they remain in their respective collections; adding a catalog product already saved can create/increment the active line without silently deleting the saved line unless product requirements specify otherwise.
7. Update `src/features/catalog/ProductCard.tsx` to invoke a reactive store action.
8. Update `src/features/cart/CartDrawer.tsx` to subscribe to active and saved collections.
9. Render separate “Cart” and “Saved for later” sections.
10. Add “Save for later” beside each active item.
11. Add “Move to cart” and “Remove” controls for each saved item.
12. Include item name, quantity, and price so users can distinguish and verify moved lines.
13. Reuse `src/components/Button.tsx` only if shared behavior or styling is added; it currently provides no value over a native button.
14. Avoid API and persistence changes because there is no cart backend contract or existing persistence mechanism.

A smaller alternative is to retain the current exported functions and add a manual subscription mechanism, but Zustand is already installed and directly solves the React synchronization defect.

**Tests**

Extend `tests/cartStore.test.ts` with focused store tests:

- Saving moves an item out of the active cart.
- Saving places it in the saved collection.
- Saving preserves product data and quantity.
- Moving a saved item restores it to the cart.
- Moving back removes it from saved items.
- Moving back merges quantities when the SKU is already active.
- Unknown IDs are no-ops and do not corrupt either collection.
- Removing a saved item does not affect active items.
- Repeated catalog additions still increment active quantity.
- `clearCart()` clears active and saved collections.
- Test setup resets all store state between cases.

UI interaction tests would require adding a component-testing dependency such as React Testing Library. Given the current dependency set, store-level tests are the minimal appropriate coverage. If UI test dependencies are approved, add `tests/CartDrawer.test.tsx` covering button actions and section updates.

Verification commands after implementation:

```text
npm test -- --run
npm run build
npm run lint
```

**Risks And Decisions**

- The present cart UI does not rerender after mutations. Adding the feature without fixing reactivity would produce apparently nonfunctional buttons.
- “Save for later” persistence is unspecified. The recommended scope is in-memory only, matching the current cart.
- Quantity semantics are unspecified. The recommendation is to preserve quantity and merge on restoration.
- Catalog-add behavior for a SKU already saved is unspecified. This should be confirmed if active and saved copies must be mutually exclusive.
- Product identity relies only on `id`; variants are unsupported.
- Prices are stored as plain numbers with no currency metadata.
- Zustand is `latest`, so behavior is not reproducible without a lockfile.
- The application fixture appears incomplete for browser execution because no `index.html` or React DOM mount was found.
- ESLint configuration was not found, so `npm run lint` may fail independently of the feature.
- No accessibility or visual conventions exist beyond native elements and one color-scheme rule.

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
- `src/features/catalog/ProductCard.tsx`
- `src/features/catalog/ProductList.tsx`
- `src/features/cart/cartStore.ts`
- `src/features/cart/CartDrawer.tsx`
- `tests/cartStore.test.ts`

**Safety Exclusions**

- Did not read `.env`.
- Did not inspect secret values or environment configuration.
- Did not modify or create files.
- Did not use Bash, task tools, subagents, or external tools.
- Did not run package installation, tests, builds, linting, or development servers.
- Did not inspect `opencode.json` because it is unrelated to application cart behavior.
- Did not propose backend synchronization, authentication, storage migrations, checkout changes, or analytics without supporting repository contracts.
```

### Context Goblin

- Duration: 72000ms
- Tool calls: 13
- context_goblin_get: yes
- context_goblin_status: no
- context_goblin_refresh: no
- context_goblin_read: no
- Input tokens: 6496
- Output tokens: 1979
- Reasoning tokens: 1045
- Cache read tokens: 17536
- Total event tokens: 27056
- Cost: 0

Tool counts:

- context_goblin_get: 1
- glob: 1
- read: 11

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
- tsconfig.json
- vite.config.ts

Errors:

- none

Final answer:

```txt
**Stack**
- TypeScript, React, Vite, Vitest
- Zustand is installed but currently unused
- Package manager is unresolved: no root lockfile was found
- State is currently an in-memory mutable singleton with no persistence or reactive subscription

**Commands**
- Development: `npm run dev`
- Tests once: `npm test -- --run`
- Lint: `npm run lint`
- Build/type-check: `npm run build`

These use npm as an invocation convention only; the repository does not identify a package manager.

**Entry Points**
- Application export: `src/main.tsx`
- Root component: `src/App.tsx`
- Catalog/cart composition: `src/routes.tsx`
- Add-to-cart interaction: `src/features/catalog/ProductCard.tsx`
- Cart UI: `src/features/cart/CartDrawer.tsx`
- Cart state: `src/features/cart/cartStore.ts`

`src/main.tsx` exports `App` but does not mount it with `createRoot`; this may be an intentionally minimal fixture.

**Recommended Changes**
1. Update `src/features/cart/cartStore.ts`.
   - Represent both `items` and `savedItems`.
   - Add atomic `saveForLater(productId)` and `moveToCart(productId)` operations.
   - Preserve quantity when saving.
   - When moving an item back, merge its quantity if the same product is already in the cart.
   - Prevent duplicate saved entries.
   - Make state reactive, preferably through the already-installed Zustand dependency, so cart and saved-item actions rerender the UI.
   - Make `clearCart()` reset both collections for deterministic tests.

2. Update `src/features/cart/CartDrawer.tsx`.
   - Subscribe to cart and saved state rather than calling a non-reactive getter during render.
   - Add a `Save for later` action beside each cart item.
   - Render a distinct saved-items section.
   - Add `Move to cart` and optionally `Remove` actions for saved items.
   - Use explicit button labels containing product names for basic accessibility.

3. Update `src/features/catalog/ProductCard.tsx` only if the store API is converted to Zustand actions.
   - Invoke the reactive store action instead of the current standalone mutator.
   - No product-card visual changes are required.

4. Expand `tests/cartStore.test.ts`.
   - Keep the existing add/remove coverage.
   - Test saving removes the complete line from the cart and adds it to saved items.
   - Test quantity preservation.
   - Test moving back removes the saved entry.
   - Test moving back merges with an independently re-added cart line.
   - Test unknown IDs are no-ops.
   - Test repeated operations do not create duplicates.
   - Test clearing resets cart and saved state.

A component test is desirable for button wiring and visible sections, but the repository has no DOM test environment or React Testing Library. Adding those dependencies solely for this feature should be a separate decision.

**Risks**
- The current store cannot trigger React rerenders; retaining its mutation model would make the feature appear stale until an unrelated render.
- State is memory-only, so saved items disappear on reload. Persistence should not be added without an explicit product requirement.
- Save-for-later quantity behavior is unspecified. The plan assumes the complete cart line and quantity are preserved.
- Products can be re-added while an equivalent item is saved; move-back semantics must explicitly merge quantities.
- `Product` is declared in `ProductCard.tsx`, causing the state layer to depend on a component module. This could be moved to a domain type file later, but it is not required for the smallest feature change.
- `vite.config.ts` is empty and the current application mounting setup appears incomplete, so build/runtime failures may predate this feature.

**Files Inspected**
- `package.json`
- `src/main.tsx`
- `src/App.tsx`
- `src/routes.tsx`
- `src/features/cart/cartStore.ts`
- `src/features/cart/CartDrawer.tsx`
- `src/features/catalog/ProductCard.tsx`
- `src/components/Button.tsx`
- `tests/cartStore.test.ts`
- `vite.config.ts`
- `tsconfig.json`

**Files Recommended**
- Modify: `src/features/cart/cartStore.ts`
- Modify: `src/features/cart/CartDrawer.tsx`
- Potentially modify: `src/features/catalog/ProductCard.tsx`
- Modify: `tests/cartStore.test.ts`
- No new file is necessary for the minimal implementation.

**Safety Exclusions**
No excluded files were inspected. In particular, no `.env` files were read. Context Goblin also excluded:
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
