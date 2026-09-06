# Rules for Editing the Site

## Principles

1. **Verify before fixing.** Always read the actual file before applying a fix. The 2.20.1 scaffold state changes frequently — a file that was buggy yesterday may already be fixed today.
2. **No blind patches.** If a file already contains the fix, skip it. A byte-for-byte identical "fix" is a no-op and may mask the real issue.
3. **Backend is 100% stock.** Do not modify `apps/backend/` unless you have a confirmed bug with a backend root cause. All known bugs are in the storefront UI layer.
4. **No runtime behavior changes from lint fixes.** Changing no-op stubs (`applyGiftCard`, `removeDiscount`, `removeGiftCard`) to throw errors changes runtime behavior. Leave upstream stubs as-is.
5. **Minimal diffs.** Only change what is necessary. Do not reformat, restructure, or "clean up" unrelated code. A fix should be a single targeted change, not a refactor.

## Bug Tracking

All bugs use a `BUG-01` through `BUG-99` identifier system:
- `BUG-01` through `BUG-99` — ordered by priority (critical runtime bugs first, UI polish last)
- Each bug gets a status: **(Fixed)**, **(Not Fixed)**, or **(No Fix Needed)**
- Bug details live in `known-issues.md`
- Fix details live in `frontend-fixes.md`

## Making Changes

### General Workflow

1. **Read the file first.** Use the Read tool to inspect the current state before editing.
2. **Identify the exact line(s) to change.** Use Grep to find the pattern if needed.
3. **Make the minimal change.** One logical change per Edit call.
4. **Verify the change.** Run `tsc --noEmit` and `pnpm run lint` in the affected app.
5. **Confirm runtime health.** Hit the dev server endpoint to ensure no 500s.
6. **Document the change.** Update `known-issues.md` status, `frontend-fixes.md` details, and `context.md` if the change affects the overall scaffold state.

### When to Edit the Site

Only make changes when:
- There is a confirmed, reproducible bug with a clear root cause.
- The user explicitly asks for a feature or fix.
- A documentation audit reveals the docs disagree with the actual code state (in that case, fix the docs, not the code).

Do NOT make changes when:
- The issue is listed as "Noise" in `known-issues.md` (e.g., `redisUrl not found`, `GET /store/locales 404`, `next lint` deprecation warning).
- The fix would require disabling an `@medusajs/*` ESLint rule. Fix the code instead.
- The change would alter runtime behavior of upstream no-op stubs.
- You are unsure whether the issue is real. Ask first.

## Storefront Code

### File Layout

Storefront code lives under `apps/storefront/src/`:

```
src/
  app/                          # Next.js App Router pages
    [countryCode]/
      (main)/
        account/
          @dashboard/
            orders/
              page.tsx         # Server component (default)
        products/
          [handle]/
              page.tsx
  lib/                          # Data layer, helpers, hooks
    data/                       # Server actions (cart, customer, checkout, products)
    hooks/                      # Client hooks (use-toggle-state, etc.)
  modules/                      # Feature modules (account, cart, checkout, common, layout, order, products)
    common/
      components/
        input/index.tsx         # Reusable input component
        modal/index.tsx         # Reusable modal wrapper
        ui/                     # Local UI primitive kit (Button, Heading, Badge, etc.)
    account/
      components/
        account-info/index.tsx  # Disclosure-based editor wrapper
        profile-name/index.tsx  # Name editor
        profile-email/index.tsx # Email editor (no-op)
        profile-billing-address/index.tsx
        address-card/
          add-address.tsx       # Add address modal trigger
          edit-address-modal.tsx # Edit address modal trigger
```

### Making UI Changes

**Rules for UI changes:**
- Use existing Tailwind utility classes. Do not add new CSS files or inline styles.
- Match the existing component pattern: if a component uses `use client`, keep it. If it is a server component, keep it server-side.
- Use the existing module alias imports (`@modules/...`, `@lib/...`, `@/...` if present). Do not add new path aliases.
- Reuse existing UI primitives from `src/modules/common/components/ui/` (Button, Heading, Badge, Text, Input, etc.). Do not introduce new UI libraries.
- For modals, use the existing `Modal` component from `@modules/common/components/modal`. Pass `size="large"` only when the form content genuinely needs more width (e.g., address forms with multiple columns).

**Example — widening a modal:**
```tsx
// Before
<Modal isOpen={state} close={close} data-testid="add-address-modal">

// After
<Modal isOpen={state} close={close} size="large" data-testid="add-address-modal">
```

**Example — fixing overflow in a Disclosure.Panel:**
```tsx
// Before
className="... overflow-visible ..."

// After
className="... overflow-hidden ..."
```

### Fixing Bugs

**Rules for bug fixes:**
- Read the file first. Confirm the bug actually exists in the current code.
- Check if the bug is listed in `known-issues.md`. If not, add it before fixing.
- Make the smallest change that resolves the issue.
- Do not "improve" or refactor surrounding code as part of a bug fix.
- After the fix, run `tsc --noEmit` and `pnpm run lint` in `apps/storefront/`.
- Hit the dev server to confirm the page renders without a 500.

**Common fix patterns in this codebase:**
- **Auth gate on account pages:** Add `retrieveCustomer()` + `notFound()` at the top of the page component before any data fetch that requires auth.
- **Type mismatch in form state:** Match the `error` type to what the server action returns (`string | null`, not `boolean`).
- **Modal overflow:** Change `max-h-[75vh]` to `max-h-[90vh]` and/or switch `overflow-visible` to `overflow-hidden`.
- **Narrow modal on desktop:** Add `size="large"` to the `<Modal>` component.

### Adding New Features

**Rules for new features:**
- Place new UI components under the appropriate `src/modules/<feature>/components/` directory.
- Place new server actions under `src/lib/data/<feature>.ts`. Keep them small: one action per file or logical group.
- Do not add new pages under `src/app/` without understanding the routing conventions (see `site-structure/storefront-routing.md`).
- Do not add new npm packages to the storefront without checking if an existing dependency already provides the functionality.
- Reuse the existing `Input`, `Button`, `Modal`, `Badge`, `Heading`, `Text` primitives. Do not add new UI component libraries.

**Example — adding a new account page:**
1. Create the page file under `src/app/[countryCode]/(main)/account/@dashboard/<page>/page.tsx`.
2. Use a server component by default. Add `"use client"` only when you need hooks or event handlers.
3. Fetch data using server actions from `src/lib/data/`.
4. Add navigation link in the account layout if needed.

### Creating and Setting Up Components

**Rules for new components:**
- Follow the existing naming convention: kebab-case for files, PascalCase for component types.
- Place reusable components under `src/modules/common/components/`.
- Place feature-specific components under `src/modules/<feature>/components/`.
- Client components must start with `"use client"`. Server components must NOT have this directive.
- Use TypeScript interfaces/types for props. Do not use `any`.
- Keep components small and focused. A component should do one thing.
- Do not add JSDoc comments unless explicitly asked.

**Example — a new client component:**
```tsx
"use client"

import { useState } from "react"
import { Button } from "@modules/common/components/ui"

type MyComponentProps = {
  label: string
  onAction: () => void
}

const MyComponent = ({ label, onAction }: MyComponentProps) => {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <Button onClick={() => setOpen(!open)}>{label}</Button>
      {open && <div>Content</div>}
    </div>
  )
}

export default MyComponent
```

**Example — a new server action:**
```ts
// src/lib/data/my-feature.ts
"use server"

import { sdk } from "@/lib/config"

export async function myAction(formData: FormData) {
  const value = formData.get("field") as string
  // business logic
  return { success: true }
}
```

## Backend Code

**Rules for backend changes:**
- **Do not edit** — backend is 100% upstream stock.
- If a backend change is truly needed:
  - Use `createStep` + `createWorkflow` for business logic
  - File-based routing: `src/api/store/<path>/route.ts`
  - Run `pnpm exec medusa db:generate <module>` after module changes
  - Run `cd apps/backend && pnpm run lint` to verify `@medusajs/eslint-plugin`

## Configurations

**Rules for config changes:**
- **pnpm-workspace.yaml**: Add overrides at the top level. This is the only place pnpm v11 reads them.
- **package.json**: Do NOT add a `pnpm` field — it is ignored on pnpm v11.
- **.gitignore**: Add `*.tsbuildinfo` and `**/tsconfig.tsbuildinfo` to prevent tracking TypeScript build cache.
- **next.config.js**: Add `qualities: [25, 50, 75, 100]` to the `images` config to silence the `next-image-unconfigured-qualities` warning.

## Verification Rules

After any fix:
1. Run `tsc --noEmit` in the affected app to confirm 0 new TypeScript errors.
2. Run `pnpm run lint` in the affected app to confirm errors didn't increase.
3. Hit the dev server endpoints to confirm no new 500s.
4. If changes are storefront-only, the backend does not need restarting.
5. **Never run `pnpm run build` while the dev server is running** — stop the dev server first.

## Documentation Rules

- Update `known-issues.md` and `frontend-fixes.md` when applying or planning a fix.
- Use `context.md` only for environment metadata and overall scaffold state — do not put bug details there.
- Use relative links between docs (e.g., `known-issues.md`) instead of cross-referencing with full paths.
- Use absolute paths only for source files (e.g., `apps/storefront/src/...`).

## Known Noise (Safe to Ignore)

- `redisUrl not found` / `Local Event Bus installed` — expected for local dev
- `GET /store/customers/me 401` — anonymous session, expected
- `GET /store/locales 404` — harmless scaffold probe
- `next lint` is deprecated — use `pnpm exec next lint` or migrate to `eslint .`
- ~335 `TS2786` errors without overrides — resolved by `pnpm-workspace.yaml` overrides (already applied)
