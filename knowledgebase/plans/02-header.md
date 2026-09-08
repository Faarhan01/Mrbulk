# Plan 02 — Header

## Objective

Adapt the reference frontend's header/navigation patterns to the MedusaJS storefront's existing `Nav` component in `src/modules/layout/templates/nav/`. The goal is to align the header's styling, spacing, and interaction patterns with the reference design, while preserving Medusa's data-fetching architecture and avoiding any backend changes.

This plan is storefront-only. Backend remains untouched.

---

## Current State Analysis

### MedusaJS Header (`src/modules/layout/templates/nav/index.tsx`)

- **Type**: Async server component by default
- **Data fetching**: `Promise.all` with `listRegions()`, `listLocales()`, `getLocale()`
- **Renders**: Sticky header with `SideMenu`, brand `LocalizedClientLink`, `Account` link, and a `Suspense` boundary around `CartButton`
- **Child components**:
  - `CartButton` — async SSR server component that calls `retrieveCart().catch(() => null)` and renders `<CartDropdown cart={cart} />`
  - `SideMenu` — client component (`"use client"`) using `@headlessui/react` `Popover`; renders `Home`/`Store`/`Account`/`Cart` links plus `LanguageSelect` and `CountrySelect`

### Reference Header Patterns

The reference frontend uses:
- Sticky header with subtle bottom border/shadow
- Logo/brand on the left, navigation links in the center or right
- Search icon, account icon, cart icon as action buttons
- Theme-driven active states for navigation items
- Responsive: collapses to a hamburger menu on mobile
- Dark mode support via `dark:` variants

### Gap Analysis

| Need | MedusaJS Current State | Gap |
|---|---|---|
| Sticky header with shadow/border | `Nav` is sticky but uses minimal styling | Need to align shadow/border with reference |
| Logo/brand link | `LocalizedClientLink` to home | Need to confirm styling matches reference |
| Navigation links | `SideMenu` renders basic links | Need to enhance with theme-driven active states |
| Search icon/action | Not present in header | **Ignored** — search is handled elsewhere |
| Cart dropdown | `CartDropdown` exists with 5s auto-open | Styling needs alignment |
| Mobile hamburger | `SideMenu` uses `Popover` with backdrop | Need to verify mobile behavior |
| Theme-driven active states | None — static link styling | Need to add based on current route |
| Dark mode | `darkMode: "class"` configured | Header needs `dark:` variants |

---

## Strategic Approach

**Do NOT replace the header with a copy of the reference.** Instead:

1. **Enhance the existing `Nav` template** — Add styling and structure to match the reference's visual hierarchy.
2. **Use Medusa's existing data flow** — Keep the `Promise.all` data fetching pattern. Do not add new server actions for header data.
3. **Theme tokens only** — Use `@medusajs/ui-preset` tokens and the new `theme.*` scale from Plan 01. Do not add new design tokens.
4. **Preserve `SideMenu` behavior** — The `Popover`-based mobile menu works well. Enhance its styling, don't replace it.
5. **Route-aware active states** — Use `usePathname()` from `next/navigation` to highlight the active nav item. Do not add new routing logic.

---

## Step 1 — Header Container Styling

### 1.1 Update `Nav` template classes

**File**: `apps/storefront/src/modules/layout/templates/nav/index.tsx`

Add/replace the root element classes to match the reference's sticky header pattern:
- Sticky positioning (`sticky top-0 z-50`)
- Background (`bg-ui-bg-base` or `bg-white`)
- Border (`border-b border-ui-border-base`)
- Shadow (`shadow-elevation-card-rest` or `shadow-sm`)
- Backdrop blur for modern feel (`backdrop-blur-xs`)

**Why**: The reference uses a subtle sticky header with a bottom border and shadow. Medusa's current header is functional but visually flat.

### 1.2 Add dark mode variants

Ensure all header classes include `dark:` variants:
- `bg-white dark:bg-ui-bg-base`
- `border-gray-200 dark:border-ui-border-base`
- `text-ui-fg-base dark:text-ui-fg-base`

**Why**: The reference supports dark mode. Medusa already has `darkMode: "class"` configured.

---

## Step 2 — Brand/Logo Link

### 2.1 Style the brand link

**File**: `apps/storefront/src/modules/layout/templates/nav/index.tsx`

The brand is currently a `LocalizedClientLink` to `/`. Enhance it with:
- Larger font size (`text-xl-semi` or `text-2xl-semi`)
- Font weight (`font-semibold`)
- Theme color accent (`text-theme-blue-600 dark:text-theme-blue-400`)

**Why**: The reference uses a prominent brand mark. Medusa's current brand link is minimal.

### 2.2 Add logo text or icon

If the store has a logo text or icon, add it here. For now, use the store name from `sdk.store.retrieve()` or a static string.

**Why**: The reference uses "Mrbulk" as the logo text. Medusa can pull the store name from the backend or use a static default.

---

## Step 3 — Navigation Links

### 3.1 Desktop navigation

**File**: `apps/storefront/src/modules/layout/templates/nav/index.tsx`

Add a desktop nav row between the brand and the cart/account actions:
- Links: `Home`, `Store`, `Categories`, `About` (if exists)
- Active state based on current pathname
- Hover/focus styles using Medusa tokens

**Why**: The reference has explicit nav links. Medusa's current header only has the brand, account link, and cart.

### 3.2 Active state logic

Use `usePathname()` to determine the active link:
```tsx
"use client"
import { usePathname } from "next/navigation"

const pathname = usePathname()
const isActive = (href: string) => pathname === href || pathname.startsWith(href)
```

Apply `text-theme-blue-600 font-semibold` for active, `text-ui-fg-subtle` for inactive.

**Why**: The reference highlights the active page in the nav. This is a common pattern that improves UX.

### 3.3 Keep SideMenu for mobile

Do not replace `SideMenu`. Ensure the desktop nav is hidden on mobile (`hidden small:flex`) and the `SideMenu` hamburger is shown (`flex small:hidden`).

**Why**: The existing `SideMenu` already handles mobile navigation correctly with `@headlessui/react` `Popover`.

---

## Step 4 — Header Actions (Cart, Account, Search)

### 4.1 Cart button

**File**: `apps/storefront/src/modules/layout/components/cart-button/index.tsx`

The `CartButton` already exists and renders `CartDropdown`. Enhance the button styling:
- Icon + count badge
- Theme accent for the badge
- `dark:` variants

**Why**: The reference has a prominent cart icon with item count. Medusa's current cart button is functional but minimal.

### 4.2 Account link

**File**: `apps/storefront/src/modules/layout/templates/nav/index.tsx`

The account link currently renders as a simple text link. Enhance it with:
- Icon (use existing `User` icon from `@modules/common/icons`)
- Consistent styling with other header actions

**Why**: The reference uses icon buttons for account and cart. This improves scanability.

### 4.3 Search action

**Status**: **IGNORED** — The reference has a search icon/action in the header. The MedusaJS storefront handles search differently (via the store page's `RefinementList`). Adding a header search trigger would require either:
- A new search modal/page
- Integration with the existing search params on `/store`
- Potentially new server actions

This is out of scope for a header styling plan. If the user wants header search, create a separate plan.

---

## Step 5 — Mobile Header

### 5.1 Hamburger menu

**File**: `apps/storefront/src/modules/layout/components/side-menu/index.tsx`

The `SideMenu` already renders a hamburger icon on mobile. Ensure:
- The hamburger is visible only on mobile (`flex small:hidden`)
- The desktop nav is hidden on mobile (`hidden small:flex`)
- The `Popover` panel has proper max-width and padding

**Why**: The reference collapses to a hamburger menu on mobile. Medusa's `SideMenu` already does this, but the styling may need alignment.

### 5.2 Mobile menu content

Ensure the mobile menu includes:
- Brand/logo at the top
- Navigation links
- Language/country selectors
- Account/cart links

**Why**: The reference's mobile menu is a full-screen or slide-in panel with all nav items. Medusa's `SideMenu` renders a fixed list — verify it includes all necessary links.

---

## Step 6 — Theme Consistency

### 6.1 Use Plan 01 tokens

All header styling must use:
- `@medusajs/ui-preset` tokens for backgrounds, borders, text
- `theme.*` color scale for accents (from Plan 01)
- `globals.css` utilities if needed (e.g. `backdrop-blur`)

### 6.2 No new design tokens

Do not add new colors, shadows, or spacing values specifically for the header. Use existing tokens or extend `tailwind.config.js` only if the token is needed by 2+ components.

---

## Verification

After implementing this plan:

1. **TypeScript**: `cd apps/storefront && pnpm exec tsc --noEmit` — 0 errors
2. **Lint**: `cd apps/storefront && pnpm run lint` — no new errors
3. **Build**: `cd apps/storefront && pnpm run build` — succeeds
4. **Runtime**: `pnpm run dev` — header renders correctly at all breakpoints
5. **Dark mode**: Toggle `.dark` on `<html>` — header renders correctly in dark mode
6. **Mobile**: Resize to `< 1024px` — hamburger menu appears, desktop nav hides
7. **Cart dropdown**: Click cart icon — dropdown opens with correct items

---

## Files Changed

| File | Change |
|---|---|
| `apps/storefront/src/modules/layout/templates/nav/index.tsx` | Enhance styling, add desktop nav, active states |
| `apps/storefront/src/modules/layout/components/cart-button/index.tsx` | Enhance cart button styling |
| `apps/storefront/src/modules/layout/components/side-menu/index.tsx` | Verify mobile menu content and styling |
| `knowledgebase/site-structure/components.md` | Update header component docs |
| `knowledgebase/customizations/rules.md` | Add header-specific rules if needed |
| `knowledgebase/customizations/instructions.md` | Add header implementation guidance |

---

## Out of Scope for This Plan

- Search icon/action in header — requires new modal/page or integration with existing search; ignored by default
- Mega menu or dropdown nav — reference may have complex dropdowns; keep Medusa's simple link list unless user requests otherwise
- Announcement bar — reference may have a top announcement strip; ignored unless user asks
- Cart drawer vs dropdown — Medusa uses dropdown; do not change to drawer without explicit request

## Ignored Features

The following are intentionally **not** part of this plan and should not be added unless the user explicitly requests them:

- **Header search** — would require a new search modal, page, or integration with existing search params. Out of scope.
- **Mega menus / dropdown navigation** — the reference may have complex dropdown nav items. Medusa's current simple link list is sufficient unless the user requests otherwise.
- **Announcement bar** — a top strip with promotions/announcements is not in the current Medusa scaffold. Out of scope.
- **Cart drawer replacement** — Medusa uses a dropdown. Do not replace it with a full-page drawer or slide-out panel unless explicitly requested.
- **New npm dependencies for icons** — the reference may use an icon library. Medusa already has `@medusajs/icons` and inline SVGs. Do not add `lucide-react` or similar unless explicitly requested.
- **Backend changes** — header personalization, saved preferences, or any feature requiring new schemas/modules. Out of scope.

**Rule:** If a reference header feature requires any of the above, document it here as "ignored" and ask the user whether to proceed before implementing.
