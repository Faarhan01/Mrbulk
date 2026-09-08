# Storefront: Checkout Architecture

## Overview

Checkout is a **URL-driven step state machine** — there is no shared state between steps. Each step is a client component that reads `useSearchParams().get("step")` to decide whether it is open. The `CheckoutForm` server component fetches shipping methods and payment providers upfront, then renders all four steps in a single column. This file documents the step routing, the `Addresses`/`Shipping`/`Payment`/`Review` internals, the `paidByGiftcard` short-circuit, and the Stripe Elements provider pattern.

## File Map

```
src/modules/checkout/templates/
  checkout-form/index.tsx          ← server component, fetches methods
  checkout-summary/index.tsx       ← CartTotals + DiscountCode + CTA

src/modules/checkout/components/
  addresses/index.tsx              ← Shipping + billing form, useActionState
  shipping-address/index.tsx       ← Shipping address fields
  billing_address/index.tsx        ← Billing address toggle + fields
  address-select/index.tsx         ← Saved address selector
  shipping/index.tsx               ← Shipping method RadioGroup + pickup split
  payment/index.tsx                ← Payment provider RadioGroup
  payment-wrapper/index.tsx        ← Conditionally wraps Stripe Elements
  stripe-wrapper.tsx               ← Stripe.js provider
  payment-button/index.tsx         ← Stripe confirm / Manual place-order switcher
  review/index.tsx                 ← Guarded Place Order button
  discount-code/index.tsx          ← Promo code form
  error-message/index.tsx          ← Error display
  country-select/index.tsx         ← Country dropdown
  submit-button/index.tsx          ← Loading-aware submit button
```

## CheckoutForm (Server)

`checkout-form/index.tsx` (38 lines):

1. Calls `listCartShippingMethods(cart.id)` — `GET /store/shipping-options?cart_id={id}`.
2. Calls `listCartPaymentMethods(cart.region?.id ?? "")` — `GET /store/payment-providers?region_id={id}`.
3. If either returns `null`, renders nothing (the `checkout-summary` CTA handles redirecting).
4. Renders all four steps in a single `grid-cols-1` column:
   - `<Addresses cart={cart} customer={customer} />`
   - `<Shipping cart={cart} availableShippingMethods={shippingMethods} />`
   - `<Payment cart={cart} availablePaymentMethods={paymentMethods} />`
   - `<Review cart={cart} />`

**Key point**: `CheckoutForm` is a server component that does the expensive SDK calls upfront. Each child step is a client component that reads `useSearchParams` for its open/closed state. There is no shared step state in React — the URL is the single source of truth.

## Step Routing Contract

Every step reads `useSearchParams().get("step")`:

| `step` value | Open component | Close condition |
|---|---|---|
| `"address"` or missing | `Addresses` | Form submits `setAddresses` → pushes `?step=delivery` |
| `"delivery"` | `Shipping` | User selects method → pushes `?step=payment` |
| `"payment"` | `Payment` | User selects provider + submits → pushes `?step=review` |
| `"review"` | `Review` | User clicks Place Order → `placeOrder()` → redirects to `/order/{id}/confirmed` |

The `getCheckoutStep` helper in `cart/templates/summary.tsx` computes the initial `?step=` for the checkout CTA:
- `"address"` if no `shipping_address.address_1` or no `email`
- `"delivery"` if address exists but no `shipping_methods`
- `"payment"` otherwise

## Addresses (Client)

`addresses/index.tsx` — 184 lines. Uses `useActionState` with `setAddresses` server action.

### `sameAsBilling` toggle
- Initial state: `true` if shipping and billing addresses are identical (via `compareAddresses`), `false` otherwise.
- `useToggleState` gives `state`, `toggle`.
- When `sameAsBilling` is `false`, the billing address form is shown.

### Edit button
When collapsed (`isOpen === false`) and a shipping address exists, an "Edit" button appears. Clicking it pushes `?step=address`.

### Form action
`useActionState(setAddresses, null)` — the action PATCHes the cart with both shipping and billing addresses. On success, the action itself redirects to `/{countryCode}/checkout?step=delivery` via `redirect()` inside the server action.

### Success/error display
- `message` from `useActionState` contains `{ success, error }`.
- On error: `<ErrorMessage>{message.error}</ErrorMessage>`.
- On success: the redirect happens in the action, so no success UI is needed.

## ShippingAddress / BillingAddress (Client)

These are presentational sub-components that render the actual address fields:
- `ShippingAddress`: first name, last name, company, address, postal code, city, province, phone, country.
- `BillingAddress`: same fields, conditionally rendered when `sameAsBilling === false`.

Both use `Input` from `@modules/common/components/input` with the floating-label contract.

## Shipping (Client)

`shipping/index.tsx` — 411 lines. `RadioGroup` of available shipping methods.

### Pickup vs shipping split
The component filters `availableShippingMethods` into two groups:
- `_shippingMethods`: options where `type !== "pickup"`.
- `_pickupMethods`: options where `type === "pickup"`.

Each group renders its own `RadioGroup`. A `showPickupOptions` toggle lets users switch between "Shipping" and "Pickup" views.

### Calculated prices
For options with `price_type === "calculated"`, the component calls `calculatePriceForShippingOption(optionId, cartId)` to get the actual price before displaying it. Flat-price options (like the seeded Standard/Express) display their price directly.

### Selection
When the user selects a shipping method, `handleSetShippingMethod` calls `setShippingMethod({ cartId, shippingMethodId })` which PATCHes the cart. The user then clicks "Continue to payment" (`handleSubmit`) which pushes `?step=payment`.

## Payment (Client)

`payment/index.tsx` — 260 lines. `RadioGroup` of payment providers.

### Provider rendering
- Stripe-like providers (`isStripeLike(providerId)` from `@lib/constants`) render `StripePaymentContainer` (wrapped in `PaymentWrapper`).
- Other providers render `PaymentContainer`.

### `paidByGiftcard` bypass
In `payment/index.tsx`, when `cart.gift_cards.length > 0 && cart.total === 0`:
- The provider `RadioGroup` is hidden (`!paidByGiftcard && ...`).
- A static "Gift card" payment method summary is shown instead.
- The "Continue to review" button is enabled without selecting a provider.

In `review/index.tsx`, `previousStepsCompleted` includes `paidByGiftcard`, so the Place Order button shows even when no payment session exists.

This is a Medusa business rule, not a storefront bug.

### Provider selection
When a Stripe-like provider is selected, `setPaymentMethod` calls `initiatePaymentSession(cart, { provider_id })` immediately to create a payment session. When the user clicks "Continue to review", `handleSubmit` calls `initiatePaymentSession` again only if the session is missing, then pushes `?step=review`.

### Button text
- No `activeSession` yet (Stripe): "Enter payment details"
- Has `activeSession` (or non-Stripe): "Continue to review"

## PaymentWrapper / StripeWrapper (Client)

`payment-wrapper/index.tsx` — conditionally wraps children in Stripe Elements:
1. Calls `loadStripe(publishableKey)` lazily (dynamic import of `@stripe/stripe-js`).
2. If the selected provider is Stripe-like, renders `<StripeWrapper>` which provides `stripe` and `elements` via `Elements` provider from `@stripe/react-stripe-js`.
3. Inside that, `<StripePaymentContainer>` renders the actual card input.

`NEXT_PUBLIC_STRIPE_KEY` is required for Stripe. If empty, `StripeWrapper` renders nothing.

## PaymentButton (Client)

`payment-button/index.tsx` — the actual order-placement switcher:

- **Stripe-like providers**: Renders `StripePaymentButton`. Uses `useStripe()` + `useElements()` and calls `stripe.confirmPayment({ redirect: "if_required" })`. Stripe handles the off-site redirect (iDEAL, Bancontact) and comes back to `/api/payment-return`.
- **`pp_system_default`**: Renders `ManualTestPaymentButton`. Calls `placeOrder()` directly, which completes the cart and redirects to `/order/{id}/confirmed`.
- **No provider selected**: Renders a disabled "Select a payment method" button.

## Review (Client)

`review/index.tsx` — 57 lines. The simplest step.

### `previousStepsCompleted` guard
```ts
const previousStepsCompleted =
  cart.shipping_address &&
  (cart.shipping_methods?.length ?? 0) > 0 &&
  (cart.payment_collection || paidByGiftcard)
```

The Review step only renders its content when all three previous steps are complete. If the user manually navigates to `?step=review` without completing the earlier steps, the heading appears dimmed (`opacity-50 pointer-events-none`) and no Place Order button is shown.

### Place Order
`<PaymentButton cart={cart} data-testid="submit-order-button" />` — same component as in the Payment step, but here it represents the final order placement.

## Checkout Summary

`checkout-summary/index.tsx` — the right sidebar on wider screens. Contains:
- `<ItemsPreviewTemplate>` — mini cart preview.
- `<CartTotals>` — subtotal, shipping, discount, taxes, total.
- `<DiscountCode>` — inline promo code form.

The checkout CTA ("Go to checkout") lives on the **cart page** (`cart/templates/summary.tsx`), not on the checkout page. The `getCheckoutStep` helper there ensures the user lands on the correct step when they click the CTA.

## Key Patterns

### URL is the only source of truth
No step state is held in React context or lifted state. Each step independently reads `useSearchParams().get("step")`. This makes the checkout stateless and bookmarkable — if a user refreshes on `?step=payment`, they land on the payment step exactly where they left off.

### Server actions for mutations
Each step's form action is a server action (`setAddresses`, `setShippingMethod`, `initiatePaymentSession`). The step advancement happens in two ways:
- `setAddresses` calls `redirect()` inside the server action to advance to `?step=delivery`.
- `setShippingMethod` and `initiatePaymentSession` do not redirect — the client pushes the query param (`router.push`) after the action completes.

### `useActionState` for form feedback
`Addresses` uses `useActionState` (not `useFormState`) because `setAddresses` is a server action that returns `{ success, error }`. The `message` from `useActionState` drives the error display.

### `paidByGiftcard` bypass
When the cart total is zero and gift cards cover it, the payment step is effectively skipped. This is a Medusa business rule, not a storefront bug.

## Data-Test IDs

| Element | `data-testid` |
|---|---|
| Edit address button | `edit-address-button` |
| Submit order button | `submit-order-button` |
