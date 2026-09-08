# Sort, Filter, and Search Params

## Overview
The product listing page (`/[countryCode]/store`) and the related category / collection / featured-products pages are driven by a small, well-bounded URL contract. Three query params — `sortBy`, `page`, `optionValueIds` — control the entire experience. This file documents the contract, the helper that parses it, the server action that consumes it, and the three client components that write to it.

## URL Contract

| Param | Type | Allowed values | Default | Example |
|---|---|---|---|---|
| `sortBy` | string | `"price_asc" \| "price_desc" \| "created_at"` | `"created_at"` | `?sortBy=price_asc` |
| `page` | string (1-based, coerced) | positive integer | `1` | `?page=2` |
| `optionValueIds` | string (repeatable) or comma-separated | `StoreProductOptionValue.id` | `[]` | `?optionValueIds=optval_01&optionValueIds=optval_02` or `?optionValueIds=optval_01,optval_02` |

Both shapes of `optionValueIds` are accepted: the **repeatable** form is what `RefinementList` writes (one append per selected option), and the **comma-separated** form is what `parseOptionValueIds` falls back to when given a `Record<string, string>` from Next.js's `searchParams` (which never gives a `URLSearchParams` object).

## Type and Constants

`apps/storefront/src/lib/util/product-option-filters.ts`:
```ts
export const OPTION_VALUE_QUERY_KEY = "optionValueIds"   // the URL param name

export type OptionValueIds = string[]

export const parseOptionValueIds = (
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>
): OptionValueIds => {
  if (typeof (searchParams as URLSearchParams).getAll === "function") {
    return Array.from(new Set((searchParams as URLSearchParams).getAll(OPTION_VALUE_QUERY_KEY)))
  }
  const raw = (searchParams as Record<string, string | string[] | undefined>).optionValueIds
  if (Array.isArray(raw)) return Array.from(new Set(raw))
  if (typeof raw === "string") return Array.from(new Set(raw.split(",")))
  return []
}
```

Both `<RefinementList>` (writer) and `parseOptionValueIds` (reader) use the same constant, so the URL contract is consistent — `?optionValueIds=optval_01&optionValueIds=optval_02` round-trips correctly. If you change the constant, change it in one place and the read/write sides stay in sync.

`apps/storefront/src/modules/store/components/refinement-list/sort-products/index.tsx:5`:
```ts
export type SortOptions = "price_asc" | "price_desc" | "created_at"
```
The labels are `"Latest Arrivals"`, `"Price: Low -> High"`, `"Price: High -> Low"`.

## Read Side: `/[countryCode]/store`

`apps/storefront/src/app/[countryCode]/(main)/store/page.tsx`:
```ts
const { sortBy, page, optionValueIds } = await searchParams ?? {}
```
- All three are read as **strings** (or arrays for `optionValueIds`).
- Passed into `<StoreTemplate sortBy={sortBy} page={page} optionValueIds={parseOptionValueIds(...)} />`.

`<StoreTemplate>` then renders `<RefinementList>` (client) and `<Suspense><PaginatedProducts>...</Suspinated></Suspense>` (server). The `<PaginatedProducts>` consumes the parsed params and calls `listProductsWithSort(...)`.

## `listProductsWithSort` (`apps/storefront/src/lib/data/products.ts:99-151`)

Server action. Steps:
1. Calls `listProducts({ pageParam: 0, queryParams: { ...queryParams, ...(optionFilters.length ? { option_value_id: optionFilters } : {}), limit: 100 }, countryCode })` — fetches up to 100 products in one round trip (the Medusa Store API does **not** sort by price server-side, so the client has to over-fetch and sort locally).
2. Calls `sortProducts(products, sortBy)` (in-place sort).
3. Computes `pageParam = (page - 1) * limit` and slices the sorted array: `sortedProducts.slice(pageParam, pageParam + limit)`.
4. Returns `{ response: { products: paginatedProducts, count: filteredCount }, nextPage: pageParam + limit | null, queryParams }` where `filteredCount` is the number of products fetched (capped at 100) and `nextPage` is the next offset (not the next page number).

The pagination math inside `listProductsWithSort`:
- `pageParam = (page - 1) * limit`
- `nextPage = filteredCount > pageParam + limit ? pageParam + limit : null` (returns the next **offset**, not the next page number)
- `paginatedProducts = sortedProducts.slice(pageParam, pageParam + limit)`

`totalPages` is not computed inside `listProductsWithSort`; it is calculated by `<PaginatedProducts>` as `Math.ceil(count / PRODUCT_LIMIT)`.

## `sortProducts` (`apps/storefront/src/lib/util/sort-products.ts`)

In-place sort. Precomputes each product's minimum price (across variants with a `calculated_price`) for the price sorts, then sorts the array:
- `"created_at"` → descending by `Date(product.created_at)`.
- `"price_asc"` / `"price_desc"` → by the precomputed `_minPrice`.

The function mutates the input array (`.sort()` returns the same reference).

## Write Side: The Three Client Components

### `<RefinementList>` (`modules/store/components/refinement-list/index.tsx`)

Client. Owns the `updateQueryParams` helper:
```ts
const updateQueryParams = useCallback(
  (updater: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString())
    updater(params)

    params.delete("page")           // ALWAYS reset to page 1 on any change

    const queryString = params.toString()
    const currentQuery = searchParams.toString()
    const nextPath = queryString ? `${pathname}?${queryString}` : pathname
    const currentPath = currentQuery
      ? `${pathname}?${currentQuery}`
      : pathname

    if (nextPath !== currentPath) {
      router.push(nextPath)
    }
  },
  [pathname, router, searchParams]
)
```

The `params.delete("page")` is the key contract: **any** sort or filter change resets the user to page 1. It does this by mutating the `URLSearchParams`, applying the change, then unconditionally stripping `page`, and only calling `router.push` when the resulting URL differs from the current one. Renders `<SortProducts>` + `<OptionsPicker>`.

### `<SortProducts>` (`modules/store/components/refinement-list/sort-products/index.tsx`)

Client. Reads current `sortBy` from `searchParams`, renders a `<FilterRadioGroup>` of the three options, and on change calls `updateQueryParams((p) => { p.set("sortBy", newValue); return p })`.

### `<OptionsPicker>` (`modules/store/components/refinement-list/options-picker/index.tsx`)

Client. On mount:
```ts
const { product_options } = await sdk.client.fetch<{ product_options: StoreProductOption[] }>(
  "/store/product-options",
  { query: { is_exclusive: false, fields: "*values" }, cache: "no-store" }
)
```
Filters to `product_options` that have at least one value. Renders a Radix `Accordion` (type `"multiple"`, all open by default). Each option is a list of pill-shaped buttons, each with `aria-pressed` reflecting whether the value is currently in the URL.

On toggle: rebuilds the `optionValueIds` array (add or remove the value, preserving order) and calls `updateQueryParams((p) => { /* delete & re-append optionValueIds for each */; return p })`.

### `<Pagination>` (`modules/store/components/pagination/index.tsx`)

Client. Reads `currentPage` and `totalPages` from props. Writes `?page={n}` via `router.push`.
- ≤ 7 pages: flat list of buttons (current page is `disabled`).
- > 7 pages: first, last, current ± 1, with ellipsis markers in the gap.

## Product-Archive Architecture (Reuse Across Pages)

The "product archive" system is the trio `<RefinementList>` + `<PaginatedProducts>` + their `searchParams` contract. It is reused, **unchanged**, on three distinct listing pages. There is no `/search` page or search provider in this install — `@types/react-instantsearch-dom` is declared in devDependencies but unused.

### Pages that mount the archive

| Page | Route | Template | Source of the page list | `RefinementList` prop | Notes |
|---|---|---|---|---|---|
| **All products** | `app/[countryCode]/(main)/store/page.tsx` | `<StoreTemplate>` (`modules/store/templates/index.tsx`) | No filter — backend returns everything | (none) | Title: "All products" (`data-testid="store-page-title"`) |
| **Category** | `app/[countryCode]/(main)/categories/[...category]/page.tsx` | `<CategoryTemplate>` (`modules/categories/templates/index.tsx`) | `categoryId` prop on `<PaginatedProducts>` (template passes the resolved category's `id`) | `hideOptionsPicker` | Title: category name + breadcrumb of parents + child list. `data-testid="sort-by-link"` on each parent. |
| **Collection** | `app/[countryCode]/(main)/collections/[handle]/page.tsx` | `<CollectionTemplate>` (`modules/collections/templates/index.tsx`) | `collectionId` prop on `<PaginatedProducts>` | `hideOptionsPicker` | Title: collection `title`. |
| **Home** | `app/[countryCode]/(main)/page.tsx` | n/a — uses `<FeaturedProducts>` → `<ProductRail>` (not the archive) | `listProducts({ queryParams: { collection_id: collection.id } })` directly | (none) | **Not** part of the archive system — separate component tree, no refinement, no pagination. Each `<ProductRail>` renders the **whole** collection (no limit/offset). |
| **Product detail** | `app/[countryCode]/(main)/products/[handle]/page.tsx` | `<ProductTemplate>` | Single product | (none) | Has its own `<RelatedProducts>` server component that fetches by `region_id` + `collection_id` + `tag_id` + `is_giftcard=false`, excludes the current product, and renders a static grid — **not** the archive pattern either. |

So the archive system is mounted on exactly three pages: **store, category, collection**. Home and PDP are separate and intentionally don't use it.

### The `hideOptionsPicker` flag

`<RefinementList>` accepts `hideOptionsPicker?: boolean` (default `false`). When `true`, the `<OptionsPicker>` is not rendered — `<SortProducts>` still appears. This is what category and collection pages use, because the product options on those filtered lists are rarely meaningful in combination with a category/collection filter (filtering "Size: M" inside "Sweatshirts" rarely improves the UX). The `/store` page does **not** pass it, so the option filter is shown there.

The full prop signature is:
```ts
type RefinementListProps = {
  sortBy: SortOptions
  search?: boolean                 // unused — dead prop
  hideOptionsPicker?: boolean
  "data-testid"?: string
}
```

> `search?: boolean` is a dead prop — declared on the component, never set by any consumer in this install, and the component does nothing with it. Likely a leftover from the Algolia/search integration that was removed.

### How a page mounts the archive

Every archive page is structured identically:

```tsx
// app/[countryCode]/(main)/{store|categories/[...category]|collections/[handle]}/page.tsx
import { parseOptionValueIds } from "@lib/util/product-option-filters"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"   // or CategoryTemplate / CollectionTemplate

export default async function Page(props: { params, searchParams }) {
  const params = await props.params
  const searchParams = await props.searchParams
  const { sortBy, page } = searchParams
  const optionValueIds = parseOptionValueIds(searchParams)

  return (
    <StoreTemplate
      sortBy={sortBy}
      page={page}
      countryCode={params.countryCode}
      optionValueIds={optionValueIds}
    />
  )
}
```

The page does only three things:
1. Pull `sortBy`, `page`, `optionValueIds` from `searchParams` (using the same parser everywhere).
2. (For category/collection) fetch the entity by handle and call `notFound()` if missing; the entity's `id` is what `<PaginatedProducts>` needs to filter the backend.
3. Forward everything to the page-specific template, which is the only thing that differs.

The templates themselves are tiny — each is ~50 lines and just composes `<RefinementList>` + `<PaginatedProducts>` inside a `content-container` flexbox, with page-specific header chrome (breadcrumbs, child categories, collection title).

### How `PaginatedProducts` propagates the filter

`modules/store/templates/paginated-products.tsx` is the only server component in the archive. It receives `collectionId?`, `categoryId?`, `productsIds?` (an explicit list), and forwards whichever is set into the `queryParams` it passes to `listProductsWithSort`:

```ts
type PaginatedProductsParams = {
  limit: number
  collection_id?: string[]
  category_id?: string[]
  id?: string[]
  order?: string
}

const queryParams: PaginatedProductsParams = { limit: 12 }
if (collectionId) queryParams["collection_id"] = [collectionId]
if (categoryId)   queryParams["category_id"]   = [categoryId]
if (productsIds)  queryParams["id"]            = productsIds
if (sortBy === "created_at") queryParams["order"] = "created_at"
```

So:
- `/store` → none of the IDs are set → no `collection_id`/`category_id` filter → all products.
- `/categories/[handle]` → `categoryId` set → backend filter is `category_id=...`.
- `/collections/[handle]` → `collectionId` set → backend filter is `collection_id=...`.
- `optionValueIds` from the URL is **always** forwarded (when present) regardless of which page, so option filtering works on all three.

The `productsIds` prop exists for callers that want an explicit list of IDs (e.g. related-products would be a natural fit, though the current code uses `listProducts` directly with a region/collection/tag filter instead). The `order` prop is only set when `sortBy === "created_at"` — for the price sorts, the backend can't sort by calculated price, so the client over-fetches and sorts in JS (see `listProductsWithSort` above).

### Why there is no `/search` page

- `app/[countryCode]/(main)/` has no `search/` route.
- `<Nav>` / `<SideMenu>` have no search input.
- `@types/react-instantsearch-dom` is declared in `apps/storefront/package.json` devDependencies but no `react-instantsearch` runtime package is installed and no Algolia/Meilisearch creds are read.
- `@medusajs/search` is a Medusa built-in module but it only **indexes** products in the backend — it has no storefront UI by default. To add search, you'd need to (a) add an Algolia/Meilisearch plugin, (b) install a client SDK, and (c) mount a search input in the Nav that links to a new `app/[countryCode]/(main)/search/page.tsx` page using the same `<RefinementList>` + `<PaginatedProducts>` pattern (passing `productsIds` based on the search results).

### Adding a new archive-style page

To mount the archive on a new page (e.g. a `/brands/[handle]` page or a `/search` page):

1. Create `app/[countryCode]/(main)/{path}/page.tsx` that pulls `sortBy`, `page`, `optionValueIds` from `searchParams` and forwards them to a new template (or to `<StoreTemplate>` if no extra chrome is needed).
2. Add `generateStaticParams` to prebuild the localized URLs (if the new page has a fixed set of slugs).
3. Pass any extra filter (`brandId`, `tagId`, etc.) as a prop to `<PaginatedProducts>` and have it forward that into `queryParams`.
4. Set `hideOptionsPicker` on `<RefinementList>` if the filter is too narrow to benefit from option filtering (collections and categories do this).

The `search?` prop on `<RefinementList>` exists for this future use case — implement a search-specific variant by adding a `search` prop that swaps the option list for a text-input-driven filter, then mount it on a new `app/[countryCode]/(main)/search/page.tsx`.

## Common Gotchas

- **Sort happens client-side** because the Medusa Store API does not sort by `calculated_price`. `listProductsWithSort` over-fetches up to 100 products; if a store has more than 100 products, only the first 100 (alphabetical/insertion order) are sortable.
- **Page resets on any change** — encoded in the unconditional `params.delete("page")` in `<RefinementList>`. Removing this line would mean a user on page 5 changing the sort would land on an empty page 5.
- **`parseOptionValueIds` accepts two shapes** — `URLSearchParams` (which `.getAll()` works on) **or** a plain record. The `getAll` duck-type is fragile but works because `URLSearchParams.getAll` is the function form and records don't have it.
- **`<RefinementList>` has a `search?: boolean` prop that's never used** — it's declared and not implemented. If you add a search-specific refinement list, wire this prop (or replace it with a dedicated `<SearchRefinementList>`).
- **No `search` page** — there is no `/search` route, no search input in the nav, no Algolia/Meilisearch provider. `@types/react-instantsearch-dom` is declared in devDependencies but the `react-instantsearch` runtime is not installed. `@medusajs/search` is a Medusa built-in module that indexes products in the backend but has no storefront UI by default — see the "Adding a new archive-style page" section above for the steps to wire one up.
- **The `category_id` and `collection_id` filters are passed as single-element arrays** (`[categoryId]` / `[collectionId]`) because the Medusa Store API expects repeatable query params, even though only one ID is ever passed in this codebase.
