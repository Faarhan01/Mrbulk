# Storefront: Cart Module Architecture

## Overview

The cart module renders the `/cart` page and the cart dropdown in the header. This file documents the cart page templates, the item update flow, the `Preview` component, and the `getCheckoutStep` logic.

## File Map

```
src/modules/cart/
├── templates/
│   ├── index.tsx           ← CartTemplate (conditional rendering)
│   ├── items.tsx           ← Items list + quantity selectors
│   ├── preview.tsx         ← Mini cart for dropdown
│   └── summary.tsx         ← DiscountCode + CartTotals + CTA
├── components/
│   ├── item/index.tsx      ← Single cart item row
│   ├── cart-item-select/index.tsx  ← Quantity dropdown
│   ├── empty-cart-message/index.tsx ← Empty state
│   └── sign-in-prompt/index.tsx     ← Sign-in CTA for guests
```

## CartTemplate

`modules/cart/templates/index.tsx` — the top-level cart page component.

### Conditional Rendering

```tsx
{cart?.items?.length ? (
  <div className="grid grid-cols-1 small:grid-cols-[1fr_360px] gap-x-40">
    <div className="flex flex-col bg-white py-6 gap-y-6">
      {!customer && (
        <>
          <SignInPrompt />
          <Divider />
        </>
      )}
      <ItemsTemplate cart={cart} />
    </div>
    <div className="relative">
      <div className="flex flex-col gap-y-8 sticky top-12">
        {cart && cart.region && (
          <div className="bg-white py-6">
            <Summary cart={cart} />
          </div>
        )}
      </div>
    </div>
  </div>
) : (
  <EmptyCartMessage />
)}
```

- If the cart has items, renders a 2-column grid: items list (flexible width) + summary (360px fixed).
- If empty, renders a "Your cart is empty" message with a link to `/store`.
- When accessed by an anonymous user (`!customer`), shows `<SignInPrompt>` + `<Divider>` above the items list.
- The summary is `sticky top-12` so it stays visible while scrolling the items list.

## ItemsTemplate

`modules/cart/templates/items.tsx` — renders a `Table` of cart items. Each row is a `<CartItem>` component.

## CartItem (Client)

`modules/cart/components/item/index.tsx` — renders a single cart item row:

- Thumbnail via `<Thumbnail size="square" .../>`.
- Product title, variant options, quantity selector, unit price, line price.
- Delete button (`<DeleteButton>`).
- Quantity changes call `updateLineItem({ lineId, quantity })` from `@lib/data/cart`.
- The quantity selector (`<CartItemSelect>`) has a hardcoded max of 10.

## CartItemSelect

`modules/cart/components/cart-item-select/index.tsx` — a `<select>` dropdown for quantity.

- Options: 1 through 10.
- On change, calls `updateLineItem({ lineId, quantity })`.
- The max of 10 is hardcoded in the component — there is no configurable max.

## CartTotals

`modules/common/components/cart-totals/index.tsx` — 82 lines. Pure presentation, receives the full `HttpTypes.StoreCart` and renders 5 rows:

| Row | `data-testid` | Source | Notes |
|---|---|---|---|
| Subtotal | `cart-subtotal` | `item_subtotal` | Excludes shipping/taxes |
| Shipping | `cart-shipping` | `shipping_total` | Free if 0 |
| Discount | `cart-discount` | `discount_subtotal` | Only when truthy |
| Taxes | `cart-taxes` | `tax_total` | |
| Total | `cart-total` | `total` | Last row, larger/bolder |

Each row's number element also carries a `data-value` with the raw numeric amount. All currency formatting goes through `convertToLocale` from `@lib/util/money`.

## Cart Summary

`modules/cart/templates/summary.tsx` — 46 lines. Composes:
- `<DiscountCode>` — inline promo code form (`applyPromotions` from `@lib/data/cart`).
- `<Divider>` — visual separator.
- `<CartTotals>` — the 5-row totals table.
- Checkout CTA button.

### Checkout CTA

The CTA's `?step=` value is computed by `getCheckoutStep(cart)`:

```ts
function getCheckoutStep(cart) {
  if (!cart.shipping_address?.address_1 || !cart.email) return "address"
  if (!cart.shipping_methods?.length) return "delivery"
  return "payment"
}
```

| Condition | Step |
|---|---|
| No shipping address or no email | `address` |
| Has address but no shipping methods | `delivery` |
| Has address + shipping methods | `payment` |

The button reads `"Go to checkout"` (`data-testid="checkout-button"`) and links to `/checkout?step={getCheckoutStep(cart)}`.

## EmptyCartMessage

`modules/cart/components/empty-cart-message/index.tsx` — renders a centered "Your cart is empty" message with an "Explore products" button that links to `/store`.

## SignInPrompt

`modules/cart/components/sign-in-prompt/index.tsx` — shown when the cart page is accessed by an anonymous user who has items in their cart. Renders a message encouraging the user to sign in to save their cart, with a link to `/account`.

## Cart Page 404

`app/[countryCode]/(main)/cart/page.tsx` calls `retrieveCart().catch((error) => { console.error(error); return notFound() })` when the cart is missing. This routes to `cart/not-found.tsx` ("The cart you tried to access does not exist. Clear your cookies and try again."), not the parent `(main)/not-found.tsx`.

## Preview Template (Cart Dropdown)

`modules/cart/templates/preview.tsx` — renders the mini cart inside the header dropdown. Shows a condensed list of items (thumbnail, title, variant options, quantity, price) and a "Go to cart" button. Uses the same `CartItem` component but in a compact layout.

## Data-Test IDs

| Element | `data-testid` |
|---|---|
| Checkout button | `checkout-button` |
| Cart subtotal | `cart-subtotal` |
| Cart shipping | `cart-shipping` |
| Cart discount | `cart-discount` |
| Cart taxes | `cart-taxes` |
| Cart total | `cart-total` |
| Empty cart explore button | (in `empty-cart-message`) |

## Key Patterns

### Cart is server-fetched
The cart page is a server component that calls `retrieveCart()` directly. The cart dropdown in the header uses `<Suspense>` with a static "Cart (0)" fallback while `retrieveCart()` loads.

### Quantity updates are client-initiated
`CartItem` uses `useState` for the local quantity selector, then calls `updateLineItem` on change. The server re-fetches the cart after the mutation.

### `getCheckoutStep` is the single source of truth
The same `getCheckoutStep` helper is used by both the cart page CTA and the checkout summary CTA. If you add a new checkout step, update this function.
