# Storefront: Listing Pages Architecture

## Overview

The store, collection, and category pages share a common listing architecture: a sidebar `RefinementList` for sorting/filtering and a `PaginatedProducts` grid for the product list. `StoreTemplate`, `CollectionTemplate`, and `CategoryTemplate` are thin wrappers that pass different IDs to the same `PaginatedProducts` component. This file documents the template composition, the `listProductsWithSort` in-memory sorting pattern, and the `optionValueIds` filtering flow.

## File Map

```
src/app/[countryCode]/(main)/
├── store/page.tsx                    ← StoreTemplate
├── collections/[handle]/page.tsx     ← CollectionTemplate
└── categories/[...category]/page.tsx ← CategoryTemplate

src/modules/store/
├── templates/
│   ├── index.tsx                     ← StoreTemplate
│   └── paginated-products.tsx        ← PaginatedProducts (async server)
├── components/
│   ├── refinement-list/index.tsx     ← Sidebar (sort + options)
│   ├── refinement-list/sort-products/index.tsx
│   ├── refinement-list/options-picker/index.tsx
│   └── pagination/index.tsx          ← Page numbers
```

## Template Composition

All three listing pages use the same layout:

```
┌──────────────────────────────────────────────────────────────────┐
│ content-container flex flex-col small:flex-row small:items-start │
│                                                                  │
│  ┌────────────────┐  ┌────────────────────────────────────────┐  │
│  │ RefinementList │  │  Header ("All products" / title)       │  │
│  │ (sidebar,      │  │  ┌──────────────────────────────────┐  │  │
│  │  min-w-[250px])│  │  │  Product grid (Suspense)         │  │  │
│  │                │  │  │  grid-cols-2 / 3 / 4            │  │  │
│  │                │  │  └──────────────────────────────────┘  │  │
│  │                │  │  Pagination (if totalPages > 1)        │  │
│  └────────────────┘  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

- Sidebar: `min-w-[250px]` with `ml-[1.675rem]` offset on `small:` screens.
- Content: `w-full` fills the remaining space.
- Both use `small:flex-row` (≥1024px).

## StoreTemplate

`modules/store/templates/index.tsx` — 47 lines:

- Props: `sortBy`, `page`, `countryCode`, `optionValueIds`.
- Renders `<RefinementList sortBy={sort} />` with both sort and options picker.
- Renders `<PaginatedProducts>` inside `<Suspense>` with `<SkeletonProductGrid />` fallback.
- `data-testid="category-container"` (note: reused from upstream, not store-specific).

## CollectionTemplate

`modules/collections/templates/index.tsx` — 51 lines:

- Props: `sortBy`, `collection`, `page`, `countryCode`, `optionValueIds`.
- Passes `collectionId={collection.id}` to `PaginatedProducts`.
- Hides options picker: `<RefinementList sortBy={sort} hideOptionsPicker />`.
- Renders collection title as `<h1>`.

## CategoryTemplate

`modules/categories/templates/index.tsx` — 105 lines:

- Props: `category`, `sortBy`, `page`, `countryCode`, `optionValueIds`.
- Passes `categoryId={category.id}` to `PaginatedProducts`.
- Hides options picker.
- Renders breadcrumb parent links + category name as `<h1>`.
- Renders child categories as a list if `category.category_children` exists.
- Renders category description if present.

## PaginatedProducts (Async Server)

`modules/store/templates/paginated-products.tsx` — 96 lines:

### Query params built:
```ts
const queryParams: PaginatedProductsParams = {
  limit: 12,
}
if (collectionId) queryParams["collection_id"] = [collectionId]
if (categoryId) queryParams["category_id"] = [categoryId]
if (productsIds) queryParams["id"] = productsIds
if (sortBy === "created_at") queryParams["order"] = "created_at"
```

### `listProductsWithSort` call:
```ts
const { response: { products, count } } = await listProductsWithSort({
  page,
  queryParams,
  sortBy,
  countryCode,
  optionValueIds,
})
```

### In-memory sorting pattern:
`listProductsWithSort` (in `src/lib/data/products.ts`) does the following:
1. Fetches **100 products** (`limit: 100`) from the backend with the query params + `option_value_id` filters.
2. Sorts them **in-memory** using `sortProducts(products, sortBy)`.
3. Slices for the current page: `sortedProducts.slice((page-1) * limit, page * limit)`.
4. Returns `{ products: paginatedProducts, count: filteredCount }`.

This means:
- Sorting is done server-side (in the server component), not by the backend.
- The backend always returns up to 100 products; pagination is manual.
- `count` is the filtered count (not the total DB count).

### Grid:
```tsx
<ul className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8" data-testid="products-list">
```

### Pagination:
Rendered only when `totalPages > 1`. `totalPages = Math.ceil(count / PRODUCT_LIMIT)` where `PRODUCT_LIMIT = 12`.

## RefinementList (Client)

`modules/store/components/refinement-list/index.tsx` — 83 lines:

### Props
| Prop | Type | Purpose |
|---|---|---|
| `sortBy` | `SortOptions` | Current sort value |
| `search` | `boolean` | Show search input (not used in current templates) |
| `hideOptionsPicker` | `boolean` | Hide the option value filter (used by collection/category pages) |
| `data-testid` | `string` | Test identifier |

### Query param management
Uses `useSearchParams` + `router.push` via `updateQueryParams`:
- `setQueryParams(name, value)` — sets a single param, deletes `page`.
- `setOptionValueIds(valueIds)` — deletes `optionValueIds` and appends new values.
- All updates construct a new `URLSearchParams`, delete `page`, and call `router.push` only when the resulting URL differs from the current one, which triggers a server re-render.

### Layout
```tsx
<div className="flex flex-col gap-12 py-4 mb-8 small:px-0 pl-6 small:min-w-[250px] small:ml-[1.675rem]">
  <SortProducts ... />
  {!hideOptionsPicker && <OptionsPicker ... />}
</div>
```

## SortProducts

`modules/store/components/refinement-list/sort-products/index.tsx`:

- Renders a `<FilterRadioGroup>` with radio buttons for sort options: `created_at` (default), `price_asc`, `price_desc`.
- Calls `setQueryParams("sortBy", value)` on change.

## OptionsPicker

`modules/store/components/refinement-list/options-picker/index.tsx`:

- Renders option value filters (e.g., Size: S/M/L/XL, Color: Black/White).
- Fetches available options from the `/store/product-options` API endpoint (`is_exclusive: false, fields: "*values"`).
- Calls `setOptionValueIds` on selection.

## Pagination

`modules/store/components/pagination/index.tsx`:

- Renders page number buttons. Current page is highlighted and disabled.
- On click, creates a new `URLSearchParams`, sets `page` to the clicked number, and calls `router.push` with the updated query string.
- `page` prop is 1-indexed.

## `generateStaticParams` for Collections/Categories

### Collections
`app/[countryCode]/(main)/collections/[handle]/page.tsx`:
- Fetches all collections via `listCollections({ fields: "*products" })` — includes products in each collection.
- Extracts collection handles.
- For each country code, returns `{ countryCode, handle }` pairs.

### Categories
`app/[countryCode]/(main)/categories/[...category]/page.tsx`:
- Fetches all categories via `listCategories()`.
- Extracts category handles.
- For each country code, returns `{ countryCode, category: [handle] }` pairs.

Both pre-build every collection/category handle for every country at build time.

## URL Contract

| Param | Source | Consumer | Purpose |
|---|---|---|---|
| `sortBy` | `SortProducts` sets via `router.push` | `StoreTemplate`/`CollectionTemplate`/`CategoryTemplate` reads as prop | Sort order |
| `page` | `Pagination` sets via `router.push` | `PaginatedProducts` reads as prop | Page number (1-indexed) |
| `optionValueIds` | `OptionsPicker` sets via `router.push` | `PaginatedProducts` → `listProductsWithSort` | Filter by option values |

All three params are managed client-side via `useSearchParams` + `router.push`. The server re-fetches on every change.

## Data-Test IDs

| Element | `data-testid` |
|---|---|
| Store/category container | `category-container` |
| Products list | `products-list` |
| Pagination | `product-pagination` |
| Sort by container | `sort-by-container` |
| Sort by link | `sort-by-link` |
| Category page title | `category-page-title` |

## Key Patterns

### Server-as-possible
`StoreTemplate`, `CollectionTemplate`, and `CategoryTemplate` are server components. `RefinementList` and `Pagination` are client components that manage URL state. `PaginatedProducts` is a server component that fetches data.

### In-memory sorting
Sorting is done in the server component via `sortProducts()` from `@lib/util/sort-products`. The backend returns up to 100 products; the server sorts and paginates them. This avoids backend sorting logic but limits the effective catalog size to 100 products per query.

### `optionValueIds` filtering
Option filters are passed as `option_value_id` query params to the backend. The backend filters products that have variants with those option values. This is done server-side by the Medusa query engine.
