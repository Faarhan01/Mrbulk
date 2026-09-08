# Shared Components

## Overview

This document defines the reusable shared components available in the storefront, where they live, how to use them, and the rules for extending them. Shared components are extracted from page-specific code into `src/modules/common/components/shared/` so they can be reused across multiple pages without duplication.

## Available Shared Components

### PageBanner

**Location**: `src/modules/common/components/shared/page-banner/index.tsx`  
**Type**: Client component (`"use client"`)  
**Purpose**: Unified page header with breadcrumb, title, description, badge, and optional background image.

#### Props

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `title` | `string` | Yes | — | Page title |
| `description` | `string` | No | — | Short description below the title |
| `badge` | `string` | No | — | Pill badge text (e.g. "Curated Department") |
| `themeColor` | `string` | No | `"blue"` | Theme accent: `blue`, `indigo`, `emerald`, `rose`, `amber`, `slate` |
| `logoText` | `string` | No | `"Mrbulk"` | Logo text appended to title |
| `onBack` | `() => void` | No | `router.back()` | Back button handler |
| `actions` | `React.ReactNode` | No | — | Action buttons/links rendered below description |
| `backgroundImage` | `string` | No | — | URL for background image |
| `backgroundAlt` | `string` | No | `""` | Alt text for background image |
| `overlayGradient` | `string` | No | Preset slate gradient | CSS gradient classes for image overlay |
| `backLabel` | `string` | No | `"Home"` | Text for the breadcrumb back-link |

#### Usage

```tsx
import { PageBanner } from "@modules/common/components/shared/page-banner"

<PageBanner
  title="Explore All Categories"
  description="Browse our structured collections..."
  badge="Department Catalog"
  themeColor="blue"
  onBack={() => router.push('/')}
  backLabel="Home"
  backgroundImage="https://..."
  backgroundAlt="Categories"
  overlayGradient="bg-gradient-to-b from-white/70 via-white/40 to-white/70 dark:from-slate-950/80 dark:via-slate-950/50 dark:to-slate-950/85"
/>
```

#### Rules

- Always provide `themeColor` so the banner adapts to the page's theme.
- When using `backgroundImage`, always provide `overlayGradient` for readability.
- The `backLabel` prop exists because different pages have different back-link semantics (e.g. "All Departments" vs "Back to Home").
- Do not add inline styles. Use Tailwind utilities or the `themeColor` prop.

---

### CategoryBarCarousel

**Location**: `src/modules/common/components/shared/category-bar/index.tsx`  
**Type**: Client component (`"use client"`)  
**Purpose**: Horizontal scrollable category button track with left/right scroll controls and drag-to-scroll.

#### Props

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `categories` | `MockCategoryPreset[]` | Yes | — | Category list |
| `selectedCategory` | `string` | No | `"All"` | Currently selected category name |
| `onSelectCategory` | `(name: string, id?: number \| string) => void` | Yes | — | Selection handler |
| `themeColor` | `string` | No | `"blue"` | Theme accent |
| `currentTheme` | `{ bg: string; text: string; border: string; ... }` | No | — | Pre-resolved theme classes |
| `className` | `string` | No | `""` | Additional wrapper classes |

#### Usage

```tsx
import { CategoryBarCarousel } from "@modules/common/components/shared/category-bar"

<CategoryBarCarousel
  categories={categories}
  selectedCategory={activeCategory}
  onSelectCategory={(name) => router.push(getCategoryUrl(name))}
  themeColor={themeColor}
  currentTheme={currentTheme}
/>
```

#### Rules

- Always pass `themeColor` and `currentTheme` for consistent active-state styling.
- The component handles drag-to-scroll internally. Do not wrap it in another scroll container.
- The `All` item is prepended automatically. Do not include it in the `categories` array.

---

### RecentlyViewedSection

**Location**: `src/modules/common/components/shared/recently-viewed/index.tsx`  
**Type**: Client component (`"use client"`)  
**Purpose**: Horizontal scrollable strip showing recently viewed products with scroll controls.

#### Props

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `products` | `MockProduct[]` | Yes | — | Full product catalog |
| `recentlyViewedIds` | `string[]` | No | — | Explicit ID list; falls back to `localStorage` |
| `currentProductId` | `string` | No | — | Product to exclude from the strip |
| `onSelectProduct` | `(id: string) => void` | Yes | — | Product selection handler |
| `title` | `string` | No | `"Recently Viewed Items"` | Section heading |
| `maxItems` | `number` | No | `10` | Max products to show |
| `className` | `string` | No | `""` | Additional wrapper classes |

#### Usage

```tsx
import { RecentlyViewedSection } from "@modules/common/components/shared/recently-viewed"

<RecentlyViewedSection
  products={products}
  currentProductId={product.id}
  onSelectProduct={(id) => router.push(getProductUrl(id))}
  title="Recently Viewed Items"
  maxItems={10}
/>
```

#### Rules

- The component reads `localStorage` key `luxestore_recently_viewed` when `recentlyViewedIds` is not provided. Do not rely on this in server components.
- Always pass `currentProductId` to exclude the current product from the strip.
- The component manages its own scroll ref and controls. Do not wrap it in another scroll container.

---

## Where to Use Shared Components

| Component | Current Consumers | Notes |
|---|---|---|
| `PageBanner` | `category-detail-page`, `categories-page`, `search-results-page` | Use for any page-level hero with breadcrumb |
| `CategoryBarCarousel` | `home-page-client`, `shop-page`, `category-detail-page`, `categories-page`, `search-results-page` | Use on any page that needs category filtering |
| `RecentlyViewedSection` | `home-page-client`, `product-detail-page` | Use wherever recently viewed products should appear |

## Where NOT to Use Shared Components

- **Home page hero slider**: The home page has a custom animated hero (`HeroBanner`). Do not replace it with `PageBanner`.
- **Admin dashboard**: These components are storefront-only. Do not import them in admin routes.
- **Checkout flow**: Checkout has its own minimal chrome. Do not add shared components there.

## Adding a New Shared Component

1. Create the folder under `src/modules/common/components/shared/<component-name>/index.tsx`.
2. Use `"use client"` only when the component needs hooks, event handlers, or browser APIs.
3. Define props with a TypeScript interface. Do not use `any`.
4. Keep the component small and focused. A component should do one thing.
5. Export both named and default exports if the component might be used in different import styles.
6. Document the component in this file after it is merged.

## Rules

- Do not modify shared components to suit a single page. If a page needs a variant, add a prop with a sensible default.
- Do not add JSDoc comments unless explicitly asked.
- Do not introduce new UI libraries. Reuse existing local UI primitives (`@modules/common/components/ui`) and Medusa preset tokens.
- All shared components must support dark mode via `dark:` variants.
