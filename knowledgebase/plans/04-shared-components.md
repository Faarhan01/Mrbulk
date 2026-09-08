# Plan 04 — Shared Components

## Objective

Implement the shared component layer (`PageBanner`, `CategoryBarCarousel`, `RecentlyViewedSection`) in `src/modules/common/components/shared/`. These components extract repeated UI patterns from page templates into reusable, theme-aware building blocks.

This plan is storefront-only. Backend remains untouched.

---

## Current State Analysis

### Existing Shared Infrastructure

- **Plan 01 (Global Styles)** — Adds `theme.*` color scale, `globals.css` utilities, and `theme-utils.ts`. **Must be completed first.**
- **Local UI kit** (`src/modules/common/components/ui/`) — `Button`, `Heading`, `Badge`, `Text`, `Input`, etc. These are the primitive building blocks.
- **Path aliases** — `@modules/*` → `modules/*`, `@lib/*` → `lib/*`
- **Existing layout components** — `Modal`, `LocalizedClientLink`, `CartTotals`, etc.

### Reference Components to Adapt

| Reference Component | Purpose | Medusa Equivalent |
|---|---|---|
| `PageBanner` | Page hero with breadcrumb, title, description, badge, background image | **New** — create under `shared/page-banner/` |
| `CategoryBarCarousel` | Horizontal scrollable category buttons with drag-to-scroll | **New** — create under `shared/category-bar/` |
| `RecentlyViewedSection` | Horizontal scrollable product strip with scroll controls | **New** — create under `shared/recently-viewed/` |

### Current Duplicated Code

Before this plan, the following patterns are duplicated across multiple pages:
- **Page hero/banner**: `category-detail-page.tsx`, `categories-page.tsx`, `search-results-page.tsx` each have inline hero sections with breadcrumbs, badges, titles, and background images.
- **Category carousel**: `home-page-client.tsx`, `shop-page.tsx`, `category-detail-page.tsx`, `categories-page.tsx`, `search-results-page.tsx` each import or duplicate `CategoryBarCarousel`.
- **Recently viewed**: `home-page-client.tsx` and `product-detail-page.tsx` each have inline recently-viewed strips.

---

## Strategic Approach

**Do NOT copy-paste the reference components.** Instead:

1. **Extract the pattern, not the code** — Understand what the reference component does, then implement it using Medusa's primitives and conventions.
2. **Use Plan 01 tokens** — All components must use `@medusajs/ui-preset` tokens, `theme.*` colors, and `globals.css` utilities.
3. **Keep components small** — Each shared component does one thing. If a page needs a variant, add a prop with a sensible default.
4. **Server vs client boundary** — Use `"use client"` only when the component needs hooks, event handlers, or browser APIs. Page templates are server components; they can pass props to client components.
5. **TypeScript interfaces** — Define props with interfaces. Do not use `any`.
6. **No new dependencies** — Use existing dependencies only. If a reference component uses a library that Medusa doesn't have (e.g., `motion/react`, `lucide-react`), find an alternative or implement the behavior with existing tools.

---

## Step 1 — PageBanner

### 1.1 Component spec

**File**: `apps/storefront/src/modules/common/components/shared/page-banner/index.tsx`

**Props**:
```ts
interface PageBannerProps {
  title: string
  description?: string
  badge?: string
  themeColor?: 'blue' | 'indigo' | 'emerald' | 'rose' | 'amber' | 'slate'
  logoText?: string
  onBack?: () => void
  actions?: React.ReactNode
  backgroundImage?: string
  backgroundAlt?: string
  overlayGradient?: string
  backLabel?: string
}
```

**Behavior**:
- Renders a breadcrumb back-link (`<ArrowLeft />` + `backLabel`)
- Renders a rounded hero container with optional background image
- When `backgroundImage` is provided, renders the image with `overlayGradient`
- When no image, renders ambient glow decorations (from Plan 01 utilities)
- Uses `getThemeClasses(themeColor)` for theme-aware styling
- Uses Medusa `Heading` and `Text` primitives for typography where appropriate, or arbitrary Tailwind values for design-system-agnostic styling

### 1.2 Implementation notes

- **Breadcrumb**: Use `button` element with `onClick={onBack}`. Default to `router.back()` if `onBack` not provided.
- **Background image**: Use `next/image` with `fill`, `object-cover`, and the overlay gradient.
- **Dark mode**: All colors must have `dark:` variants.
- **Responsive**: Use `sm:` and `lg:` breakpoints for padding and font sizes.

### 1.3 Consumers to update

Replace inline heroes in:
- `category-detail-page.tsx`
- `categories-page.tsx`
- `search-results-page.tsx`

---

## Step 2 — CategoryBarCarousel

### 2.1 Component spec

**File**: `apps/storefront/src/modules/common/components/shared/category-bar/index.tsx`

**Props**:
```ts
interface CategoryBarCarouselProps {
  categories: Array<{ id: string | number; name: string }>
  selectedCategory?: string
  onSelectCategory: (categoryName: string, categoryId?: number | string) => void
  themeColor?: 'blue' | 'indigo' | 'emerald' | 'rose' | 'amber' | 'slate'
  currentTheme?: { bg: string; text: string; border: string; lightBg: string; badge: string; accent: string; primaryHex: string; shadow: string; ring: string }
  className?: string
}
```

**Behavior**:
- Horizontal scrollable button track
- Left/right scroll buttons
- Drag-to-scroll support (mouse + touch)
- Active category styling based on `currentTheme` or `themeColor`
- Auto-scrolls active item into view when `selectedCategory` changes
- `All` item prepended automatically

### 2.2 Implementation notes

- **Scroll container**: Use a `div` with `overflow-x-auto`, `scroll-smooth`, and `snap-x snap-mandatory`.
- **Drag-to-scroll**: Implement with `onMouseDown`, `onMouseMove`, `onMouseUp`, `onMouseLeave` event handlers. Track `startX` and `scrollLeft` state.
- **Scroll buttons**: Disabled state based on `scrollLeft > 0` and `scrollLeft < scrollWidth - clientWidth`.
- **Active state**: Use `currentTheme.bg` + `text-white` if provided, else fallback to `themeColor`-based classes.
- **Hover state**: Use `themeColor`-based hover classes.
- **No new dependencies**: The reference uses `lucide-react` for `ChevronLeft`/`ChevronRight`. Medusa has `@medusajs/icons` with `ChevronDown`, `ChevronUpDown`, etc. Use those or inline SVGs.

### 2.3 Icon alternatives

Medusa's `@medusajs/icons` includes: `Back`, `ChevronDown`, `ChevronUpDown`, `X`, `Refresh`, `Spinner`, `Trash`, `User`, etc.

For `ChevronLeft` and `ChevronRight`, use inline SVG components (create `chevron-left.tsx` and `chevron-right.tsx` under `src/modules/common/icons/`) or use `ChevronUpDown` with rotation CSS.

**Recommendation**: Create inline SVG icons for `chevron-left` and `chevron-right` to match the reference exactly.

### 2.4 Consumers to update

Already migrated in the reference work:
- `home-page-client.tsx`
- `shop-page.tsx`
- `category-detail-page.tsx`
- `categories-page.tsx`
- `search-results-page.tsx`

---

## Step 3 — RecentlyViewedSection

### 3.1 Component spec

**File**: `apps/storefront/src/modules/common/components/shared/recently-viewed/index.tsx`

**Props**:
```ts
interface RecentlyViewedSectionProps {
  products: MockProduct[]
  recentlyViewedIds?: string[]
  currentProductId?: string
  onSelectProduct: (productId: string) => void
  title?: string
  maxItems?: number
  className?: string
}
```

**Behavior**:
- Derives recently viewed products from `recentlyViewedIds` or `localStorage` key `luxestore_recently_viewed`
- Filters out `currentProductId`
- Limits to `maxItems` (default 10)
- Renders a horizontal scrollable card strip
- Scroll left/right buttons
- Item count display

### 3.2 Implementation notes

- **Data source**: Accept `recentlyViewedIds` as a prop. If not provided, read from `localStorage`. This makes the component flexible for both server-fetched and client-only usage.
- **localStorage key**: The reference uses `luxestore_recently_viewed`. Keep this key for consistency, or use a Medusa-specific key like `medusa_recently_viewed`. **Recommendation**: Keep the reference key since this is a client-side-only feature and the data is already stored under that key in the reference.
- **Product card**: Use existing product card patterns from the storefront. Do not create a new product card component inside this shared component — render the product using existing primitives or accept a `renderProduct` prop.
- **Scroll controls**: Implement with `scrollBy({ left: ±260, behavior: 'smooth' })`.
- **Dark mode**: All card styles must have `dark:` variants.

### 3.3 Consumers to update

- `home-page-client.tsx` — replace inline recently viewed
- `product-detail-page.tsx` — replace inline recently viewed

---

## Step 4 — Icons

### 4.1 Create missing icons

If `chevron-left` and `chevron-right` are not in `@modules/common/icons/`, create them:

**Files**:
- `apps/storefront/src/modules/common/icons/chevron-left.tsx`
- `apps/storefront/src/modules/common/icons/chevron-right.tsx`

**Pattern**: Follow the existing icon component pattern — default export, accept `color`, `size`, and standard SVG props.

**Why**: The `CategoryBarCarousel` needs left/right chevron icons. Medusa's current icon set doesn't include them.

---

## Step 5 — Theme Integration

### 5.1 Use Plan 01 utilities

All shared components must:
- Import `getThemeClasses` from `src/lib/theme-utils.ts`
- Accept `themeColor` prop with sensible defaults
- Use `theme.*` color classes for accents
- Use `globals.css` utilities for gradients and glows (if needed)

### 5.2 No hardcoded theme classes

Do not hardcode `bg-blue-600` or similar in shared components. Always derive from `themeColor` prop or `currentTheme` object.

---

## Step 6 — Testing and Verification

### 6.1 Component isolation

Test each component in isolation before integrating into pages:
- Create a temporary test page or use Storybook if available
- Verify props, events, and responsive behavior

### 6.2 Integration testing

After replacing inline code with shared components:
- Verify each consumer page renders correctly
- Verify dark mode on each consumer page
- Verify responsive behavior on each consumer page
- Verify no console errors

---

## Verification

After implementing this plan:

1. **TypeScript**: `cd apps/storefront && pnpm exec tsc --noEmit` — 0 errors
2. **Lint**: `cd apps/storefront && pnpm run lint` — no new errors
3. **Build**: `cd apps/storefront && pnpm run build` — succeeds
4. **Runtime**: `pnpm run dev` — all pages load without errors
5. **Dark mode**: Toggle `.dark` on `<html>` — all shared components render correctly
6. **Responsive**: Test at `320px`, `768px`, `1024px`, `1440px` — components adapt correctly
7. **Accessibility**: Verify buttons have `aria-label`, images have `alt`, focus states are visible

---

## Files Changed

| File | Change |
|---|---|
| `apps/storefront/src/modules/common/components/shared/page-banner/index.tsx` | **NEW** — PageBanner component |
| `apps/storefront/src/modules/common/components/shared/category-bar/index.tsx` | **NEW** — CategoryBarCarousel component |
| `apps/storefront/src/modules/common/components/shared/recently-viewed/index.tsx` | **NEW** — RecentlyViewedSection component |
| `apps/storefront/src/modules/common/icons/chevron-left.tsx` | **NEW** — if missing |
| `apps/storefront/src/modules/common/icons/chevron-right.tsx` | **NEW** — if missing |
| `apps/storefront/src/lib/theme-utils.ts` | **NEW** — from Plan 01 |
| `apps/storefront/src/styles/globals.css` | **UPDATED** — from Plan 01 |
| `apps/storefront/tailwind.config.js` | **UPDATED** — from Plan 01 |
| `apps/storefront/src/modules/layout/templates/nav/index.tsx` | **UPDATED** — from Plan 02 |
| `apps/storefront/src/modules/layout/templates/footer/index.tsx` | **UPDATED** — from Plan 03 |
| `apps/storefront/src/@modules/home/templates/home-page-client.tsx` | **UPDATED** — use shared components |
| `apps/storefront/src/@modules/products/templates/category-detail-page.tsx` | **UPDATED** — use PageBanner |
| `apps/storefront/src/@modules/products/templates/categories-page.tsx` | **UPDATED** — use PageBanner |
| `apps/storefront/src/@modules/products/templates/search-results-page.tsx` | **UPDATED** — use PageBanner |
| `apps/storefront/src/@modules/products/templates/product-detail-page.tsx` | **UPDATED** — use RecentlyViewedSection |
| `knowledgebase/customizations/shared-components.md` | **NEW** — API reference |
| `knowledgebase/site-structure/components.md` | **UPDATED** — document shared components |

---

## Prerequisites

- **Plan 01 (Global Styles)** must be completed first. Shared components depend on `theme.*` colors and `globals.css` utilities.
- **Plan 02 (Header)** is independent but benefits from the same theme tokens.
- **Plan 03 (Footer)** is independent but benefits from the same theme tokens.

---

## Out of Scope for This Plan

- `motion/react` / Framer Motion — ignored by default
- New npm dependencies — ignored by default
- Backend schema changes — never in scope
- Admin customizations — out of scope

## Ignored Features

The following are intentionally **not** part of this plan and should not be added unless the user explicitly requests them:

- **Animation libraries** (`motion/react`, `framer-motion`) — the reference may use these for transitions. Medusa does not currently have them. Do not add unless explicitly requested.
- **Icon libraries** (`lucide-react`) — the reference uses `lucide-react`. Medusa uses `@medusajs/icons` and inline SVGs. Do not add `lucide-react` unless explicitly requested. Create inline SVGs for missing icons instead.
- **Image gallery/lightbox** — if the reference has a product image gallery with lightbox, that is a separate component plan. This plan only covers the three shared components listed above.
- **Product card variants** — if the reference has specialized product cards (e.g., for recently viewed, featured products), create a separate plan for those. Use existing product card patterns in this plan.
- **Backend personalization** — if the reference's recently viewed or category carousel uses backend-stored preferences, that requires backend modules. Client-side `localStorage` is sufficient for this plan.
- **Server actions for shared components** — shared components should accept data via props. Do not create new server actions specifically for shared components; use existing ones in the consuming pages.

**Rule:** If a reference shared-component feature requires any of the above, document it here as "ignored" and ask the user whether to proceed before implementing.
