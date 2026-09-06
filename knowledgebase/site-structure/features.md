# Features Reference

## Overview
How each major feature works in the storefront, from the user journey through the code.

## Feature Map

| Feature | Pages | Data Layer | Templates |
|---|---|---|---|
| Home | `/` | `listCollections()` | Hero, FeaturedProducts |
| Product Listing | `/store` | `listProducts()` | Store template |
| Product Detail | `/products/[handle]` | `listProducts()` | Product template |
| Collections | `/collections/[handle]` | `retrieveCollection()` | Collection template |
| Categories | `/categories/[...category]` | `getCategoryByHandle()` | Category template |
| Cart | `/cart` | `retrieveCart()`, `addToCart()`, `updateLineItem()` | Cart template |
| Checkout | `/checkout` | `listCartShippingMethods()`, `listCartPaymentMethods()` | CheckoutForm, CheckoutSummary |
| Account | `/account` | `retrieveCustomer()`, `signup()`, `login()` | Account dashboard |
| Orders | `/account/orders`, `/order/[id]/confirmed` | `retrieveOrder()`, `listOrders()` | Order confirmation |
| Order Transfer | `/order/[id]/transfer/[token]` | `createTransferRequest()`, `acceptTransferRequest()`, `declineTransferRequest()` | Transfer request page |
| Email Verification | `/verify-account` | `confirmEmailVerification()` | Verification page |

## Home Page
**Route**: `src/app/[countryCode]/(main)/page.tsx`
- Page-level `metadata: { title: "Medusa Next.js Starter Template", description: ... }`
- Server component, awaits `props.params` (Next.js 15 async params) to get `countryCode`
- `const region = await getRegion(countryCode)`
- `const { collections } = await listCollections({ fields: "id, handle, title" })` — narrow fields only
- Renders `<Hero />` followed by `<FeaturedProducts collections={collections} region={region} />` (each collection becomes a `ProductRail`); returns `null` if either fetch is missing.

## Product Listing (Store)
**Route**: `src/app/[countryCode]/(main)/store/page.tsx`
1. Reads query params: `sortBy`, `page`, `optionValueIds`
2. Fetches products via `listProducts()` with region pricing
3. Pagination, sorting, option filtering

## Product Detail (PDP)
**Route**: `src/app/[countryCode]/(main)/products/[handle]/page.tsx`
1. Gets `handle` from params, region via `getRegion()`
2. Fetches product via `listProducts({ queryParams: { handle } })`
3. Variant selection via `?v_id=` query param
4. `generateStaticParams()` pre-renders all product/region combinations

## Collections
**Route**: `src/app/[countryCode]/(main)/collections/[handle]/page.tsx`
- `retrieveCollection(id)` → renders products in the collection

## Categories
**Route**: `src/app/[countryCode]/(main)/categories/[...category]/page.tsx`
- Catch-all `[...category]`
- `getCategoryByHandle(categoryHandle)` → renders category hierarchy

## Cart
**Route**: `src/app/[countryCode]/(main)/cart/page.tsx`

Operations (data layer: `src/lib/data/cart.ts`):

| Operation | Function | API Endpoint |
|---|---|---|
| Get cart | `retrieveCart(cartId?)` | `GET /store/carts/{id}` |
| Create/get cart | `getOrSetCart(countryCode)` | `POST /store/carts` |
| Update cart | `updateCart(data)` | `POST /store/carts/{id}` |
| Add item | `addToCart({ variantId, quantity, countryCode })` | `POST /store/carts/{id}/line-items` |
| Update item | `updateLineItem({ lineId, quantity })` | `POST /store/carts/{id}/line-items/{lineId}` |
| Delete item | `deleteLineItem(lineId)` | `DELETE /store/carts/{id}/line-items/{lineId}` |
| Set shipping | `setShippingMethod({ cartId, shippingMethodId })` | `POST /store/carts/{id}/shipping-methods` |
| Apply promo | `applyPromotions(codes)` | `POST /store/carts/{id}/promotions` |
| Place order | `placeOrder(cartId?)` | `POST /store/carts/{id}/complete` |

Cookies:
- `_medusa_cart_id` (cart ID), `_medusa_jwt` (customer token), `_medusa_cache_id` (cache namespace)

## Checkout
**Route**: `src/app/[countryCode]/(checkout)/checkout/page.tsx`

Steps (URL-driven via `?step=`):
1. Address (shipping + billing) — `Addresses`, `ShippingAddress`, `BillingAddress`
2. Delivery (shipping method) — `Shipping` → `setShippingMethod`
3. Payment (provider + Stripe Elements if applicable) — `Payment` (RadioGroup of providers), `initiatePaymentSession` on select, then `PaymentButton` (Stripe / Manual switch) — `stripe.confirmPayment({ redirect: "if_required" })` for Stripe, `placeOrder()` direct for `pp_system_default`
4. Review + place order — `Review`

Promo codes are applied inline via `DiscountCode` (`applyPromotions` from `@lib/data/cart`).

`PaymentWrapper` (`src/modules/checkout/components/payment-wrapper/`) loads `loadStripe(publishableKey)` lazily and conditionally renders `StripeWrapper` → `StripePaymentContainer` for card capture. `cart.complete()` finalizes the order and redirects to `/order/{id}/confirmed`. Stripe return is handled by `src/app/api/payment-return/route.ts`.

## Account
**Routes**: parallel `@dashboard` + `@login`

| Feature | Route | Data Layer |
|---|---|---|
| Profile | `/account/profile` | `updateCustomer()` |
| Addresses | `/account/addresses` | `addCustomerAddress`, `deleteCustomerAddress`, `updateCustomerAddress` |
| Orders | `/account/orders` | `listOrders()` |
| Order Details | `/account/orders/details/[id]` | `retrieveOrder()` |
| Login/Register | `/account` (parallel `@login` slot) | `login()`, `signup()` |
| Logout | N/A (server action redirect) | `signout()` |

Auth flow:
1. Signup: `sdk.auth.register()` → auth identity + email verification (if enabled)
2. Login: `sdk.auth.login()` → JWT
3. Token in `_medusa_jwt` cookie
4. Guest cart transferred to customer on login

## Orders
**Route**: `src/app/[countryCode]/(main)/order/[id]/confirmed/page.tsx`
- `retrieveOrder(id)` fetches with payments + items expanded

## Order Transfer
**Routes**:
- `/order/[id]/transfer/[token]` — Create / view transfer request
- `/order/[id]/transfer/[token]/accept` — Accept
- `/order/[id]/transfer/[token]/decline` — Decline

## Regions and Localization
1. `src/middleware.ts` reads country from URL prefix → `cf.country` → `x-vercel-ip-country` → `NEXT_PUBLIC_DEFAULT_REGION` fallback
2. 307 redirect to region-prefixed URL if missing
3. 1-hour in-memory region map
4. `_medusa_cache_id` cookie namespaced fetch cache

Locale:
- `_medusa_locale` cookie stores user preference
- `x-medusa-locale` header injected on every SDK call

## Seed Data

The `initial-data-seed.ts` script creates (executed by `pnpm exec medusa db:migrate`):

| Entity | Details |
|---|---|
| Sales Channel | `Default Sales Channel` (1) |
| Publishable API Key | `Default Publishable API Key` linked to default channel (1) |
| Store | `Default Store`, currencies: EUR (default) + USD (1) |
| Region | `Europe`, currency EUR, countries: gb, de, dk, se, fr, es, it (7) |
| Tax Regions | 7 (one per country) using `tp_system` provider |
| Stock Location | `European Warehouse` (Copenhagen, DK) (1) |
| Fulfillment Set | `European Warehouse delivery` (shipping) + service zone `Europe` (1) |
| Shipping Options | `Standard Shipping` (2-3 days) and `Express Shipping` (24h), both `flat` pricing in EUR/USD/region (2) |
| Product Categories | `Shirts`, `Sweatshirts`, `Pants`, `Merch` (4) |
| Product Options | Size: S/M/L/XL · Color: Black/White |
| Products | Medusa T-Shirt, Medusa Sweatshirt, Medusa Sweatpants, Medusa Shorts (4) |
| Variants | T-Shirt has 8 (Size × Color), others have 4 (Size only) — total 20 |
| Pricing | All variants 10 EUR / 15 USD |
| Inventory | 1,000,000 units per variant at European Warehouse |
| Images | S3-hosted thumbnails + back/front images from medusa-public-images bucket |

Verified post-seed counts in the project database:
- 4 products, 20 variants, 1 region, 1 stock location, 1 publishable API key, 1 sales channel, 1 store

## Current Feature Gaps
1. **Gift cards**: data-layer stubs but no UI
2. **Promotions UI**: `applyPromotions()` works but no storefront entry UI
3. **Wishlists / Reviews / Search UI**: not implemented
4. **Multi-currency switcher**: EUR + USD seeded, but no UI to switch
5. **Tax display in cart/checkout**: backend calculates, UI doesn't render
6. **Returns/Exchanges storefront**: not implemented

## Feature Architecture
```
┌────────────────────────────────────────────────────────────┐
│              Storefront (Next.js 15, Turbopack)            │
├────────────────────────────────────────────────────────────┤
│  Pages (App Router, Server Components)                     │
│   → Data Layer (Server Actions, "use server")              │
│      → Medusa JS SDK                                       │
│        → Backend REST API (http://localhost:9000)          │
│          → Medusa Core Modules                             │
│            → PostgreSQL Database                          │
└────────────────────────────────────────────────────────────┘
```