# Cart and Checkout Behavior

## Overview
The cart is the only piece of the storefront with persistent client-side state (the dropdown's 5-second auto-open timer) and the only one that interacts with cross-site payment redirects. Checkout is a step state machine driven by a `?step=` URL search param. This file documents the actual behavior — including the timer state machine, the cart-mismatch banner, the free-shipping nudge rule resolution, and the Stripe payment-return handler.

## Cart Dropdown (`modules/layout/components/cart-dropdown/`)

### Components
- `cart-button/index.tsx` — async server component. `const cart = await retrieveCart().catch(() => null)`. Renders `<CartDropdown cart={cart} />`. Errors are swallowed so a missing cart doesn't break the header. Wrapped in `<Suspense>` from `nav/index.tsx` with a static "Cart (0)" fallback.
- `cart-dropdown/index.tsx` — client component using `@headlessui/react` `Popover` / `PopoverButton` / `PopoverPanel` / `Transition`. 420px wide popover; sorts items by `created_at` descending; shows the line-item thumbnail via `Thumbnail size="square"`, `LineItemOptions`, `LineItemPrice`, and a `DeleteButton` per item.

### 5-Second Auto-Open Timer
Defined in `cart-dropdown/index.tsx:25-74`. State machine:

```
1. `totalItems` is derived from cart.items.reduce((acc, i) => acc + i.quantity, 0) || 0.
2. `itemRef = useRef<number>(totalItems || 0)` is a ref that holds the previously-seen count.
3. `useEffect` on `[totalItems, itemRef.current]`:
     - if (itemRef.current !== totalItems && !pathname.includes("/cart")) → call `timedOpen()`.
4. `timedOpen()` calls `open()` (setCartDropdownOpen(true)) and `setTimeout(close, 5000)`.
5. `openAndCancel()` (called on `onMouseEnter` of the wrapper) clears the active timer and opens.
6. The `useEffect` cleanup on `[activeTimer]` calls `clearTimeout(activeTimer)` on unmount.
```

The timer fires **only** when the count actually changes (i.e. a line item was added/removed/quantity-changed) and the user is not on the cart page. Initial mount, server re-renders with the same count, and routes that include `/cart` all suppress the auto-open. The `eslint-disable-next-line react-hooks/exhaustive-deps` on the auto-open effect is intentional — the dependency on `pathname` is captured implicitly via the `usePathname()` read, and adding it would re-fire the effect on every navigation.

### Data-Test IDs in the Cart Dropdown
- `nav-cart-link` (top-level link)
- `nav-cart-dropdown` (popover panel)
- `cart-item`, `product-link`, `cart-item-variant`, `cart-item-quantity`, `cart-item-remove-button`
- `cart-subtotal` (with `data-value={subtotal}`)
- `go-to-cart-button` (the bottom CTA)
- On the empty state: a 0-in-circle and a `Button` reading "Explore products" that links to `/store` and closes the panel.

## Cart Mismatch Banner

`modules/layout/components/cart-mismatch-banner/index.tsx` (56 lines) — client component.

- **When shown**: only inside `(main)/layout.tsx` when `customer && cart` are both present **and** the cart is not yet attached (`!cart.customer_id`). This is the silent-failure case where a guest added items, signed in, but the auto `transferCart()` on login didn't take.
- **UI**: orange `bg-orange-100` banner with inline `<button>` retry.
- **Retry button**: `onClick={async () => { setState("transferring"); await transferCart().finally(() => setState("idle")) }}` — toggles between `"Run transfer again"` and `"Transferring.."`.
- It re-renders whenever the cart or customer changes, so a successful retry removes it automatically (the cart gets `customer_id` set).

## Free-Shipping Price Nudge

`modules/shipping/components/free-shipping-price-nudge/index.tsx` (284 lines) — client component with two variants.

### Rule Resolution
For each shipping option in the cart's `shipping_options`, the component filters `option.prices` to those that:
1. match the cart's `currency_code`, AND
2. have a `price_rules` entry with `attribute === "item_total"`.

The first such price with `amount === 0` is treated as the **free-shipping tier** (the seeded `Standard Shipping` has a single flat price, not a tiered rule, so the nudge **never triggers out of the box** — the rule-based tiers need to be set up in the admin).

### Operators
`computeTarget()` handles `gt`, `gte`, `lt`, `lte` (default `gt`). It returns `{ current_amount, target_amount, target_reached, target_remaining, remaining_percentage }` which drives the progress bar.

### Variants
- `variant="inline"` — a horizontal progress bar used inside the cart page (cart-side bar). Shows `"Only $X away"` → `"Free Shipping unlocked!"` on `target_reached`.
- `variant="popup"` — a fixed bottom-right card used in `(main)/layout.tsx`. Has a dismiss `XMark` button (`isClosed` state in localStorage-style — actually in-memory). When `target_reached` becomes true, it auto-hides after 1s via `opacity-0 invisible delay-1000`.

## Cart Totals Component

`modules/common/components/cart-totals/index.tsx` (82 lines) — pure presentation, receives the full `HttpTypes.StoreCart` and renders 5 rows:

| Row | `data-testid` | Source | Notes |
|---|---|---|---|
| Subtotal | `cart-subtotal` | `item_subtotal` | Excludes shipping/taxes |
| Shipping | `cart-shipping` | `shipping_total` | Free if 0 |
| Discount | `cart-discount` | `discount_subtotal` | Only when truthy |
| Taxes | `cart-taxes` | `tax_total` | |
| Total | `cart-total` | `total` | Last row, larger/bolder |

Each row's number element also carries a `data-value` with the raw numeric amount. All currency formatting goes through `convertToLocale` from `@lib/util/money`.

## Cart Page Summary

`modules/cart/templates/summary.tsx` (46 lines) — `<DiscountCode>` + `<Divider>` + `<CartTotals>` + a checkout CTA.

The CTA's `?step=` value is computed by `getCheckoutStep(cart)`:
- `"address"` if the cart has no `shipping_address.address_1` or no `email`,
- `"delivery"` if it has an address but no `shipping_methods`,
- `"payment"` otherwise.

The button reads `"Go to checkout"` (`data-testid="checkout-button"`) and links to `/checkout?step={getCheckoutStep(cart)}` so the user lands on the right step.

## Checkout Step Routing

Every checkout subcomponent is a client component that reads `useSearchParams().get("step")` to decide whether it's currently open. There is **no shared state** between them — the URL is the only source of truth.

| Step value | Component that opens |
|---|---|
| (missing) or `address` | `<Addresses>` |
| `delivery` | `<Shipping>` |
| `payment` | `<Payment>` |
| `review` | `<Review>` |

`setAddresses` (server action) PATCHes the cart and pushes `/checkout?step=delivery`. `<Shipping>` calls `setShippingMethod` on selection and pushes `?step=payment`. `<Payment>` calls `initiatePaymentSession` on selection and pushes `?step=review` after submission. `<Review>` renders `<PaymentButton>` to place the order.

## Payment Step Internals

`modules/checkout/components/payment/index.tsx` (260 lines) — `@headlessui/react` `RadioGroup` of providers.

- Reads `availablePaymentMethods` (from `listCartPaymentMethods` server action in `checkout-form/index.tsx`).
- For each provider, chooses `StripePaymentContainer` (if `isStripeLike(providerId)`) or `PaymentContainer` (otherwise).
- The selected `activeSession` is the `payment_sessions?.find(s => s.status === "pending")`.
- The `paidByGiftcard` short-circuit: when the cart has `gift_cards.length > 0 && cart.total === 0`, the entire provider list is hidden and the step is considered ready.
- The submit `Button` text flips: `"Enter payment details"` for Stripe (no `activeSession` yet) → `"Continue to review"` for everything else.

`payment-button/index.tsx` is the actual order-placement switcher. For Stripe-like providers it renders `StripePaymentButton` (uses `useStripe()` + `useElements()` and calls `stripe.confirmPayment({ redirect: "if_required" })`), for `pp_system_default` it renders `ManualTestPaymentButton` (calls `placeOrder()` directly), otherwise it shows a disabled "Select a payment method" button.

## `app/api/payment-return/route.ts` State Machine

The only Next.js Route Handler in the storefront. Triggered when Stripe redirects back to the storefront after an off-site authorization (e.g. iDEAL, Bancontact). Reads these query params:

- `cart_id` (required) — the cart that initiated the session
- `country_code` (required for path prefixing)
- `payment_intent` (required) — Stripe's PaymentIntent id
- `payment_intent_client_secret` (required) — used to validate the session
- `redirect_status` — `"succeeded"` (or absent), `"processing"`, or `"failed"`

Flow:
1. If any required param is missing → redirect to `/{prefix}/cart?error=payment_failed`.
2. Fetch the cart with `fields: "payment_collection.payment_sessions.data"`. If the cart has a `payment_session` whose `data.id === paymentIntent` and `data.client_secret === paymentIntentClientSecret`, validation passes. Otherwise → `payment_failed` redirect.
3. On validation pass, `setCartId(cartId)` re-establishes the cart cookie (the redirect from the bank loses it sometimes — the lax sameSite on the cart cookie handles top-level navigation, but explicitly re-setting here is a belt-and-braces).
4. If `redirect_status === "failed"`: forward the Stripe `payment_intent`, `payment_intent_client_secret`, `redirect_status` query params to `/{prefix}/checkout?step=payment` so the Payment Element can re-mount against the same `requires_payment_method` PaymentIntent and the user can retry.
5. Otherwise, call `placeOrder(cartId)`. On success, `placeOrder` itself redirects to `/{countryCode}/order/{id}/confirmed`. On throw, `unstable_rethrow(error)` re-throws framework errors (redirects, etc.) and otherwise redirects to `/{prefix}/cart?error=order_failed`.

## Cart Page 404

`app/[countryCode]/(main)/cart/page.tsx` calls `retrieveCart()` and then `notFound()` when the cart is missing. This routes to `cart/not-found.tsx` ("Clear your cookies and try again."), not the parent `(main)/not-found.tsx`.

## Adding a New Step

1. Create a new `modules/checkout/components/{name}/index.tsx` (client component, reads `useSearchParams`).
2. Add the step constant to all the relevant places (`<Addresses>` handles the default + `"address"`, etc.).
3. Update the `getCheckoutStep` helper in `cart/templates/summary.tsx` to push users to the right step.
4. Update the form-action that completes the previous step to push `?step={newStep}` instead of the next one.
5. If the step needs a server action (e.g. set addresses), add the action to `lib/data/cart.ts` with the appropriate `revalidateTag("carts")` call.
