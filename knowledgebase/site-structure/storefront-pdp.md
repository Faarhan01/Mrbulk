# Storefront: Product Detail Page (PDP) Architecture

## Overview

The Product Detail Page (PDP) is the most complex page in the storefront. It uses a **3-column sticky layout** on desktop, variant-driven image swapping, a mobile-only fixed bottom bar with a full-screen option picker dialog, and a related-products section at the bottom. This file documents the architecture, the server/client component split, the variant selection flow, and the image-swap logic.

## File Map

```
src/app/[countryCode]/(main)/products/[handle]/page.tsx   ← server component
src/modules/products/templates/index.tsx                  ← ProductTemplate (server)
src/modules/products/templates/product-info/index.tsx     ← ProductInfo (server)
src/modules/products/components/product-actions-wrapper/  ← server wrapper + Suspense
src/modules/products/components/product-actions/index.tsx ← ProductActions (client)
src/modules/products/components/product-actions/option-select.tsx
src/modules/products/components/product-actions/mobile-actions.tsx
src/modules/products/components/image-gallery/index.tsx   ← ImageGallery (client)
src/modules/products/components/product-tabs/index.tsx    ← ProductTabs (client)
src/modules/products/components/related-products/index.tsx ← RelatedProducts (server)
src/modules/products/components/product-price/index.tsx   ← ProductPrice (client)
src/modules/products/components/product-onboarding-cta/index.tsx
```

## Page Component (Server)

`app/[countryCode]/(main)/products/[handle]/page.tsx`:

1. `generateStaticParams()` pre-builds every `{countryCode, handle}` combination at build time. It calls `listProducts({ countryCode: country, queryParams: { limit: 100, fields: "handle" } })` for every country to discover handles.
2. `generateMetadata()` fetches the product by handle and sets SEO metadata.
3. The default export:
   - Awaits `params` and `searchParams` (Next.js 15 async params).
   - Reads `searchParams.v_id` (selected variant ID).
   - Calls `listProducts({ countryCode: params.countryCode, queryParams: { handle: params.handle } })` to get the priced product.
   - Calls `getImagesForVariant(pricedProduct, selectedVariantId)` to filter images.
   - Renders `<ProductTemplate>` with `product`, `region`, `countryCode`, `images`.

`v_id` is the only query param the PDP cares about. It is written by `ProductActions` and read here to swap the gallery images.

## `getImagesForVariant` Logic

```ts
function getImagesForVariant(product, selectedVariantId?) {
  if (!selectedVariantId || !product.variants) return product.images

  const variant = product.variants.find(v => v.id === selectedVariantId)
  if (!variant || !variant.images?.length) return product.images

  const imageIdsMap = new Map(variant.images!.map((i) => [i.id, true]))
  return product.images?.filter((i) => imageIdsMap.has(i.id)) ?? null
}
```

- If no variant is selected (or the variant has no images), all product images are shown.
- If a variant has images, only those images are shown.
- Returns `null` if the filter yields no images — the page component passes `images ?? []`.

## ProductTemplate Layout (Server)

`modules/products/templates/index.tsx` — a **3-column flex layout** on `small:` breakpoint (1024px):

```
┌──────────────────────────────────────────────────────────────────┐
│ content-container flex flex-col small:flex-row small:items-start │
│                                                                  │
│  ┌─────────────┐  ┌──────────────────┐  ┌─────────────────────┐ │
│  │ ProductInfo  │  │   ImageGallery   │  │ ProductTabs         │ │
│  │ (sticky     │  │   (scrolls      │  │ (sticky top-48     │ │
│  │  top-48,   │  │    naturally)   │  │  max-w-[300px])     │ │
│  │  max-w-300)│  │                  │  │                     │ │
│  └─────────────┘  └──────────────────┘  └─────────────────────┘ │
│                                                                  │
│  RelatedProducts (full width below)                              │
└──────────────────────────────────────────────────────────────────┘
```

- **Left column** (`max-w-[300px] sticky top-48`): `ProductInfo` + `ProductTabs`. Stays visible while the user scrolls the gallery.
- **Center column** (`w-full`): `ImageGallery`. Natural scroll height.
- **Right column** (`max-w-[300px] sticky top-48`): `ProductOnboardingCta` + `ProductActionsWrapper` inside a `<Suspense>`.

Both side columns are `sticky top-48` (96px top offset, matching the header height). The `small:flex-row` breakpoint is `1024px` (defined in `tailwind.config.js` as `small`).

## ProductActionsWrapper (Server → Client Bridge)

`modules/products/templates/product-actions-wrapper/index.tsx`:

This is the only server component in the PDP's interactive area. Its job is to:
1. Fetch the product with real-time pricing via `listProducts({ queryParams: { id: [id] }, regionId })` (server-side data fetch).
2. Pass the fetched `product` and `region` to the client `ProductActions`.
3. Wrap `ProductActions` in a `<Suspense>` boundary in `ProductTemplate` with a disabled skeleton fallback.

This pattern keeps the product data fetch out of the client bundle while still allowing the client component to manage variant selection state.

## ProductActions (Client)

`modules/products/components/product-actions/index.tsx` — 199 lines. Owns all variant selection state:

### State
- `options: Record<string, string | undefined>` — currently selected option values, keyed by option ID.
- `isAdding: boolean` — loading state during `addToCart`.

### Preselect single-variant products
If `product.variants.length === 1`, a `useEffect` auto-populates `options` from that variant's options on mount.

### Variant matching
`selectedVariant` is derived via `useMemo` by finding the variant whose options match `options` exactly. The helper `optionsAsKeymap` converts each variant's `options` array into a `Record<option_id, value>`, then `isEqual` compares that keymap to the current `options` state.

`isValidVariant` is derived via `useMemo` by checking if ANY variant matches the current `options` state. If no combination of selected options corresponds to an existing variant, the "Add to cart" button shows "Out of stock".

### URL sync
A `useEffect` watches `selectedVariant` and `isValidVariant`. When the selected variant changes:
1. If `v_id` in URL already matches → no-op.
2. If a valid variant is selected → `params.set("v_id", value)` then `router.replace(pathname + "?" + params.toString())`.
3. If no valid variant → `params.delete("v_id")`.

This is the mechanism that triggers `getImagesForVariant` on the server on the next navigation/render.

### Stock check
`inStock` is derived from the selected variant:
- `manage_inventory === false` → always in stock.
- `allow_backorder === true` → in stock.
- `manage_inventory === true` and `inventory_quantity > 0` → in stock.
- Otherwise → out of stock.

### Add to cart
`handleAddToCart` calls `addToCart({ variantId, quantity: 1, countryCode })` from `@lib/data/cart`.

### Button states
| Condition | Button text |
|---|---|
| No variant selected | "Select variant" |
| Out of stock or invalid | "Out of stock" |
| Adding | isLoading spinner |
| Ready | "Add to cart" |

## OptionSelect (Client)

`modules/products/components/product-actions/option-select.tsx` — renders a single option group (e.g., "Size" or "Color"). Uses custom `<button>` elements with `clx` styling. Calls `updateOption(optionId, value)` on selection.

## MobileActions (Client)

`modules/products/components/product-actions/mobile-actions.tsx` — 203 lines. Shows a **fixed bottom bar** on mobile (`lg:hidden`) only when the desktop `ProductActions` is out of view.

### Intersection observer pattern
`ProductActions` passes `show={!inView}` where `inView` comes from `useIntersection(actionsRef, "0px")`. When the desktop actions scroll out of view, `show` becomes `true` and the mobile bar appears.

### Mobile bottom bar
- Fixed `inset-x-0 bottom-0 z-50`.
- Shows thumbnail, title, price, and an "Add to cart" / "Select variant" button.
- Clicking the button opens a `@headlessui/react` Dialog (`useToggleState`).

### Mobile Dialog
The dialog renders the same `OptionSelect` components as desktop, plus the `Add to cart` button. This gives mobile users a full-screen option picker without the sticky-column layout.

## ProductTabs (Client)

`modules/products/components/product-tabs/index.tsx` — uses Radix `Accordion` (type `"multiple"`, all open by default). Two panels:
- **Product information** — renders structured metadata: Material, Country of origin, Type, Weight, Dimensions.
- **Shipping & returns** — static text about shipping policy.

## RelatedProducts (Server)

`modules/products/components/related-products/index.tsx` — async server component. Fetches products by:
1. Same `collection_id` as the current product.
2. Same `tag_id` as the current product.
3. Excludes the current product by ID.
4. Region-scoped via `regionId`.

Renders a `ProductRail` grid (same pattern as the home page). Wrapped in `<Suspense>` with `<SkeletonRelatedProducts />`.

## ImageGallery (Client)

`modules/products/components/image-gallery/index.tsx` — renders the product images. Receives `images` as a prop (already filtered by `getImagesForVariant`). Shows the first image as the main thumbnail and the rest as a scrollable row below.

## ProductInfo (Server)

`modules/products/templates/product-info/index.tsx` — renders the product title, subtitle, and basic metadata. Server component, no client state.

## Key Patterns

### Server/Client Split
The PDP uses the **server-as-possible** pattern:
- `page.tsx` is a server component that fetches the product and region.
- `ProductTemplate` is a server component that composes the layout.
- `ProductInfo` is a server component.
- `RelatedProducts` is a server component.
- `ProductActionsWrapper` is a server component that fetches variants and wraps the client component.
- `ProductActions`, `ImageGallery`, `ProductTabs`, `MobileActions`, `OptionSelect` are client components.

### Variant Selection Flow

```
User clicks option button
  → setOptionValue(optionId, value)
    → options state updates
      → selectedVariant recalculated (useMemo)
        → isValidVariant recalculated (useMemo)
          → useEffect fires: router.replace("?v_id=<id>")
            → Next.js re-renders page.tsx with new searchParams
              → getImagesForVariant returns variant-specific images
                → ImageGallery re-renders with new images
                  → Add to cart button enables
```

### `v_id` Query Param Contract

| Param | Source | Consumer | Purpose |
|---|---|---|---|
| `v_id` | `ProductActions` writes via `router.replace` | `page.tsx` reads via `searchParams.v_id` | Drives `getImagesForVariant` image filtering |

`v_id` is not a "real" route param — it's a client-side URL state that causes the server to re-render with different images. This is the same pattern used by `sortBy`, `page`, and `optionValueIds` in the listing pages.

### Sticky Layout Constraints

Both side columns use `small:sticky small:top-48`. This means:
- They stick 12rem (192px) from the top of the viewport.
- They only stick on `small:` screens (≥1024px). Below that, the layout collapses to a single column.
- The center column (`ImageGallery`) is not sticky — it scrolls naturally.

## Data-Test IDs

| Element | `data-testid` |
|---|---|
| Product container | `product-container` |
| Add to cart button | `add-product-button` |
| Option select group | `product-options` |
| Related products container | `related-products-container` |

## Related Products Query Logic

`RelatedProducts` fetches products with these filters:
- `region_id` from the current region.
- `collection_id` matching the current product's collection (if any).
- `tag_id` matching the current product's tags (if any).
- `is_giftcard = false`.
- Excludes the current product by ID.
- Default limit: 12 (from `listProducts`), rendered in a responsive grid (`grid-cols-2 small:grid-cols-3 medium:grid-cols-4`).
