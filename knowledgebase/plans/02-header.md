# Plan 02 — Header

## Objective

Style and refine the existing MedusaJS header (`src/modules/layout/templates/nav/index.tsx`) and its child components to match the visual quality of the reference frontend, **without adding new features, duplicating existing functionality, or breaking Medusa's architecture**.

The reference header (`ref/modern/Nextjsfrontend`) was researched thoroughly. It contains a cart **drawer**, search **megamenu overlay**, desktop **nav links with hover dropdowns**, and a full-screen mobile **drawer**. Our Medusa header uses a cart **dropdown**, a Popover-based mobile **SideMenu**, and has no search or desktop nav links. We will adapt the reference visual patterns into Medusa's existing structure using our global style system and Medusa UI tokens.

---

## Key Principles

1. **Designs and global styling first.** Before touching any component logic or adding features, apply global classes, tokens, and layout improvements to what already exists.
2. **Static/visual adaptations second.** Reference patterns that can be implemented purely with styling or existing Medusa components (no new files, no new data fetching) come next.
3. **New features third.** Anything requiring new components, new pages, or new data fetching only happens after the above are complete.
4. **No duplicates.** If Medusa already has a feature, we refine it — we do not create a second implementation.
5. **Respect Medusa architecture.** Keep server components server-side. Keep client components client-side. Do not add new npm packages.
6. **Adapt, don't copy.** The reference is a different stack. We take the visual pattern and implement it with Medusa's components and data layer.

---

## Reference Header Research Summary

### Reference Architecture

The reference header is a single client component (`StoreHeader`) with multiple child components:

| Component | Type | Purpose |
|---|---|---|
| `StoreHeader` | Client (`'use client'`) | Main header orchestrator, manages scroll state, search state, mobile menu state |
| `DesktopNavLinks` | Client | Desktop navigation: Home, Shop, Categories dropdown, Company dropdown, User menu dropdown, Seller Hub, Admin |
| `HeaderSearch` | Client | Desktop search input with autocomplete |
| `HeaderActions` | Client | Right-side actions: theme toggle, account icon, wishlist icon, cart icon, mobile search toggle, mobile menu toggle |
| `MobileNavDrawer` | Client | Full-screen mobile drawer with accordions for Categories, Company, Account/Orders, Wishlist, Track Order, Seller Hub, Admin |
| `CategoriesDropdown` | Client | Hover-based dropdown with category images, subcategories, item counts |
| `CompanyDropdown` | Client | Hover-based dropdown with About, Contact, FAQ |
| `UserMenuDropdown` | Client | Hover/click dropdown with Account, Order Tracking, Wishlist, Cart trigger, Seller Portal |
| `SearchMegamenuOverlay` | Client | Full-width overlay with popular search tags, search results grid, quick add to cart |
| `CartButton` | Client | Icon button that opens a cart **drawer** (not dropdown) |

### Reference Patterns We Can Adapt Without Adding Features

| Pattern | Reference Implementation | Medusa Adaptation | Requires New Feature? |
|---|---|---|---|
| Icon-style account button | `User` icon in rounded-full button with active state | Convert Account text link to icon button using `@medusajs/icons` | No — uses existing link |
| Cart badge styling | Icon + count badge with theme color | Style `CartDropdown` trigger with `.btn.btn-icon` + `.badge` | No — existing cart |
| Active state styling | `isActive(path)` with theme colors | `usePathname()` in `CartDropdown`/`SideMenu` | No — client components already exist |
| Hover/focus micro-interactions | `hover:scale-105 active:scale-95`, `focus-visible:ring-2` | Add transition utilities via global classes | No — pure CSS |
| Brand prominence | Logo text + icon, `text-lg font-extrabold` | Style existing `LocalizedClientLink` with global classes | No — existing brand link |
| Mobile hamburger | Icon button, `lg:hidden` | `SideMenu` already does this — enhance styling | No — existing SideMenu |
| Cart drawer → dropdown | Reference uses `cartOpen` state + drawer panel | Our `CartDropdown` is a Popover — style it to match reference visual quality | No — different mechanism, same visual goal |

### Reference Features That Are Out of Scope

| Feature | Why Out of Scope |
|---|---|
| **Cart drawer** | Reference uses a drawer (slides from right). Medusa uses a Popover dropdown. Converting to a drawer requires new component structure and state management. Out of scope unless explicitly requested. |
| **Search megamenu overlay** | Reference has a full search overlay with popular tags, results grid, and quick add to cart. Medusa handles search on `/store` via `RefinementList`. Adding header search requires a new modal/page or integration with existing search params. Create a separate plan if needed. |
| **Desktop nav links** | Reference has Home, Shop, Categories dropdown, Company dropdown, User menu dropdown, Seller Hub, Admin. Medusa's header has none of these. Adding desktop nav requires new components and routing. Out of scope unless explicitly requested. |
| **Wishlist button** | No Medusa module for wishlists. Would require backend changes. |
| **Theme toggle** | No dark mode toggle in the storefront. `darkMode: "class"` is configured but not exposed to users. |
| **User avatar** | Reference shows user avatars in the header. Medusa does not fetch avatar URLs in the current customer schema. |
| **Lucide icons** | Reference uses `lucide-react`. Medusa uses `@medusajs/icons` and inline SVGs. Do not add new icon libraries. |
| **Mobile full-screen drawer** | Reference has a full-screen mobile drawer with accordions for Categories, Company, User menu. Medusa uses a Popover-based `SideMenu`. Converting to a drawer requires new component structure. Out of scope unless explicitly requested. |

---

## Stage 1 — Global and Design Foundation (Styling Only)

**Goal:** Apply global styling to the existing header structure. No new buttons, no new links, no new data fetching, no component creation. This is purely a styling pass using `globals.css` utilities and Medusa preset tokens.

### 1.1 Header Container

**File:** `apps/storefront/src/modules/layout/templates/nav/index.tsx`

Apply the `.navbar-surface` global class to the `<header>` element. This gives us:
- `background: var(--bg-base)` / `border-color: var(--border-base)` / `color: var(--fg-base)`
- Automatic dark mode switching via `.dark` on `<html>`

Also add subtle elevation:
- `shadow-elevation-card-rest` for default state

**Current:**
```tsx
<header className="relative h-16 mx-auto border-b duration-200 bg-white border-ui-border-base">
```

**Target:**
```tsx
<header className="navbar-surface relative h-16 mx-auto border-b duration-200 shadow-elevation-card-rest">
```

### 1.2 Brand Link

**File:** `apps/storefront/src/modules/layout/templates/nav/index.tsx`

Style the `LocalizedClientLink` to match the reference's brand prominence:
- Use `text-xl-semi` for size/weight
- Add `hover:text-ui-fg-base` for interaction
- Keep `uppercase` if desired for brand consistency

**Current:**
```tsx
<LocalizedClientLink
  href="/"
  className="txt-compact-xlarge-plus hover:text-ui-fg-base uppercase"
  data-testid="nav-store-link"
>
```

**Target:**
```tsx
<LocalizedClientLink
  href="/"
  className="text-xl-semi hover:text-ui-fg-base uppercase tracking-tight"
  data-testid="nav-store-link"
>
```

### 1.3 Cart Button Styling

**File:** `apps/storefront/src/modules/layout/components/cart-button/index.tsx`

The `CartButton` is a server component that renders `CartDropdown`. The dropdown trigger already shows the cart count. We enhance the trigger styling:
- Apply `.btn.btn-icon` classes to the trigger button inside `CartDropdown`
- Ensure the count badge uses `.badge` global classes

**File:** `apps/storefront/src/modules/layout/components/cart-dropdown/index.tsx`

Apply `.btn.btn-icon` to the cart trigger button. Apply `.badge` to the count span.

### 1.4 SideMenu (Mobile Hamburger)

**File:** `apps/storefront/src/modules/layout/components/side-menu/index.tsx`

The hamburger trigger is a `Popover.Button` with text "Menu". Enhance it:
- Replace text with `Menu` icon from `@medusajs/icons`
- Apply `.btn.btn-icon` classes
- Keep the existing `Popover` behavior — no structure changes

**Current:**
```tsx
<Popover.Button
  data-testid="nav-menu-button"
  className="relative h-full flex items-center transition-all ease-out duration-200 focus:outline-none hover:text-ui-fg-base"
>
  Menu
</Popover.Button>
```

**Target:**
```tsx
<Popover.Button
  data-testid="nav-menu-button"
  className="btn btn-icon btn-ghost rounded-full text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-base-hover"
>
  <Menu className="w-4 h-4" />
</Popover.Button>
```

### 1.5 Dark Mode Variants

All header classes must work with `darkMode: "class"`. Since we're using Medusa preset tokens (`bg-ui-bg-base`, `text-ui-fg-base`, `border-ui-border-base`) and our new `.navbar-surface` global class, dark mode is automatic — no extra `dark:` variants needed.

Verify by toggling `.dark` on `<html>` during Stage 1 verification.

---

## Stage 2 — Reference Adaptations Without New Features

**Goal:** Apply reference visual patterns using only existing Medusa components, existing data, and global classes. No new buttons, no new links, no new data fetching, no new files.

These are the reference patterns we can adapt **without adding any new functionality**:

- **Icon-style buttons instead of text links for account** — convert the Account text link to an icon button using existing `@medusajs/icons` and `.btn.btn-icon`
- **Active state styling for nav items** — use `usePathname()` in client components (`SideMenu`, `CartDropdown`) to highlight the current page
- **Badge styling for cart count** — apply `.badge` global classes to the cart count in `CartDropdown`
- **Hover/focus states using Medusa tokens** — add `transition-all duration-150`, `hover:bg-ui-bg-base-hover`, `focus-visible:ring-2 focus-visible:ring-ui-fg-interactive` to interactive elements
- **Proper spacing and alignment** — ensure consistent gaps, padding, and alignment using Medusa spacing tokens

### 2.1 Account Link → Icon Button

**File:** `apps/storefront/src/modules/layout/templates/nav/index.tsx`

Convert the Account text link to an icon-button style using existing `@medusajs/icons`:
- Use `User` icon from `@medusajs/icons`
- Apply `.btn.btn-icon` global classes
- Add `rounded-full` for the reference's circular button shape
- Add `border-ui-border-base` for subtle border
- Add hover/focus states using Medusa tokens

**Current:**
```tsx
<LocalizedClientLink
  className="hover:text-ui-fg-base"
  href="/account"
  data-testid="nav-account-link"
>
  Account
</LocalizedClientLink>
```

**Target:**
```tsx
<LocalizedClientLink
  href="/account"
  className="btn btn-icon btn-ghost rounded-full border border-ui-border-base text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-base-hover"
  data-testid="nav-account-link"
>
  <User className="w-4 h-4" />
</LocalizedClientLink>
```

**Note:** We use `LocalizedClientLink` (existing component) rather than creating a new button. The `btn-icon` class gives us the square aspect-ratio and centering. The `border` class adds the subtle outline the reference uses.

### 2.2 Active State for Account/Cart Icons

Use `usePathname()` in client-side components (`CartDropdown`, `SideMenu`). `Nav` is a server component, so we cannot use `usePathname()` there directly. Instead:

- **CartDropdown** — already a client component. Can detect if current path is `/cart` and apply active styling.
- **SideMenu** — already a client component. Can highlight the active link in the mobile menu.

**Option:** If desktop active states are needed, create a small client wrapper inside `Nav`:
```tsx
// Inside nav/index.tsx
import ActiveAwareLink from "./active-aware-link"

// In JSX:
<ActiveAwareLink href="/account" icon={User} />
```

Only create `active-aware-link.tsx` if desktop nav links are added later.

### 2.3 Cart Count Badge

Ensure the cart count badge in `CartDropdown` uses `.badge` global classes:
```tsx
<span className="badge badge-new">{cart.items?.length || 0}</span>
```

### 2.4 Hover/Focus Micro-interactions

Apply global transition utilities to interactive elements:
- `transition-all duration-150` on icon buttons
- `hover:bg-ui-bg-base-hover` for subtle background change
- `focus-visible:ring-2 focus-visible:ring-ui-fg-interactive` for accessibility
- `active:scale-95` only if it doesn't conflict with existing transitions

### 2.5 Spacing and Alignment

Ensure consistent spacing using Medusa tokens:
- Header height: `h-16` (64px) — matches reference
- Icon button size: `w-8 h-8` or `w-9 h-9` — matches reference
- Gap between actions: `space-x-1` or `space-x-1.5` — matches reference
- Brand padding: consistent with action padding

---

## Stage 3 — Review and Refinement

**Goal:** Verify visual consistency, dark mode, and mobile behavior.

### 3.1 Visual Audit

Check at all breakpoints:
- Desktop (`>= 1024px`): Brand center, actions right, no hamburger
- Tablet (`768px - 1023px`): Same as desktop
- Mobile (`< 768px`): Hamburger visible, desktop nav hidden

### 3.2 Dark Mode Audit

Toggle `.dark` on `<html>` and verify:
- Header background switches correctly
- Text color switches correctly
- Borders switch correctly
- Buttons/icons remain visible

### 3.3 Accessibility Audit

- All interactive elements have `focus-visible` styles
- Icon buttons have `aria-label` or `title` attributes
- Color contrast meets WCAG AA

---

## Files to Modify

| File | Change | Stage |
|---|---|---|
| `apps/storefront/src/modules/layout/templates/nav/index.tsx` | Header classes, brand link, account link → icon button | 1 + 2 |
| `apps/storefront/src/modules/layout/components/cart-button/index.tsx` | Ensure server component passes correct classes to CartDropdown | 1 |
| `apps/storefront/src/modules/layout/components/cart-dropdown/index.tsx` | Cart trigger → `.btn.btn-icon`, badge → `.badge` | 1 + 2 |
| `apps/storefront/src/modules/layout/components/side-menu/index.tsx` | Hamburger → icon + `.btn.btn-icon` | 1 |

**No new files in any stage.** All changes reuse existing components and global classes.

---

## What We Do Not Change

- No new layout structure
- No new data fetching
- No new server actions
- No new npm packages
- No new CSS files
- No changes to `SideMenu` Popover behavior
- No changes to `CartDropdown` open/close logic
- No changes to account/cart routing
- No search, wishlist, theme toggle, or other reference features not in Medusa

---

## Key Differences from Reference (Architectural)

These are **intentional** differences between our Medusa header and the reference. They are **not** bugs or missing features — they reflect different architectural choices.

| Aspect | Reference | Medusa | Reason |
|---|---|---|---|
| Cart interaction | Drawer (slides from right) | Popover dropdown | Medusa scaffold uses Popover; drawer requires new component |
| Search | Megamenu overlay with results grid | No header search; search on `/store` | Medusa handles search via `RefinementList` |
| Desktop nav | Full nav links with hover dropdowns | No desktop nav links | Not in Medusa scaffold |
| Mobile menu | Full-screen drawer with accordions | Popover-based `SideMenu` | Medusa scaffold uses Popover |
| Wishlist | Icon button with badge | Not implemented | No Medusa wishlist module |
| Theme toggle | Icon button | Not exposed | `darkMode: "class"` configured but no UI toggle |
| User avatar | Shown in header/account button | Not fetched | Medusa customer schema doesn't include avatar URLs |
| State management | React contexts (cart, auth, wishlist, UI) | Server components + SDK | Medusa uses RSC + server actions |

---

## Verification Checklist

- [ ] `pnpm exec tsc --noEmit` — 0 errors
- [ ] `pnpm run lint` — no new errors
- [ ] Dev server compiles without errors
- [ ] Header renders correctly at all breakpoints
- [ ] Hamburger menu appears on mobile, desktop nav unaffected
- [ ] Cart dropdown opens and shows correct count
- [ ] Account icon button links to `/account`
- [ ] Brand link links to `/`
- [ ] Dark mode: toggle `.dark` on `<html>`, header renders correctly
- [ ] No new npm packages added
- [ ] No new CSS files created
- [ ] All styling uses global classes or Medusa preset tokens

---

## Out of Scope

- Cart drawer replacement (Medusa uses dropdown)
- Header search / search megamenu
- Desktop nav links with dropdowns
- Wishlist button
- Theme toggle
- User avatar in header
- Mobile full-screen drawer
- Mega menu / dropdown navigation
- Announcement bar

## Ignored Reference Features

The reference header includes features that are **not** part of this plan:

- **Cart drawer** — Reference uses a drawer (slides from right). Medusa uses a Popover dropdown. Converting requires new component structure. Out of scope.
- **Search megamenu overlay** — Reference has a full search overlay with popular tags, results grid, quick add to cart. Medusa handles search on `/store` via `RefinementList`. Adding header search requires a new modal/page. Out of scope.
- **Desktop nav links with dropdowns** — Reference has Home, Shop, Categories dropdown, Company dropdown, User menu dropdown, Seller Hub, Admin. Medusa's header has none. Adding requires new components and routing. Out of scope.
- **Wishlist button** — No Medusa wishlist module exists. Would require backend changes.
- **Theme toggle** — Reference has a dark/light mode toggle. Medusa's storefront does not expose dark mode to users. Out of scope.
- **User avatar** — Reference shows user avatars in the header. Medusa does not fetch avatar URLs in the current customer schema. Out of scope.
- **Mobile full-screen drawer** — Reference has a full-screen mobile drawer with accordions. Medusa uses a Popover-based `SideMenu`. Converting requires new component structure. Out of scope.
- **Lucide icons** — Reference uses `lucide-react`. Medusa uses `@medusajs/icons` and inline SVGs. Do not add new icon libraries.

**Rule:** If a reference header feature is not in Medusa's scaffold, document it here as "ignored" and ask the user whether to proceed before implementing.
