# Plugins and Integrations

## Overview
This Medusa installation uses **no external plugins**. All commerce functionality comes from Medusa's built-in **core commerce modules** and **infrastructure modules**. The storefront integrates with **Stripe** for payment processing (provider ids `pp_stripe_stripe` / `pp_stripe-ideal_stripe` / `pp_stripe-bancontact_stripe` available in `constants.tsx`; not registered unless a Stripe plugin is added).

The storefront's local UI kit (`src/modules/common/components/ui/`) ships by default with the upstream starter; this install did not modify it.

## Backend: No External Plugins

### medusa-config.ts
```ts
module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    }
  }
})
```

No `plugins` array. No `@medusajs/plugin-*` packages installed.

## Core Commerce Modules (Built-In via `@medusajs/medusa` 2.20.1)

| Module | Purpose |
|---|---|
| `product` | Products, variants, options, categories |
| `cart` | Shopping cart, line items |
| `order` | Orders, exchanges, returns |
| `customer` | Customer accounts, addresses |
| `inventory` | Stock levels, reservations |
| `fulfillment` | Shipping providers, methods |
| `payment` | Payment providers, sessions |
| `pricing` | Price lists, calculated prices |
| `promotion` | Discounts, promo codes |
| `region` | Regions, countries, currencies |
| `sales_channel` | Sales channels |
| `tax` | Tax providers, rates |
| `currency` | Currencies |
| `store` | Store settings |
| `api_key` | Publishable + secret keys |
| `user` | Admin users, invites |
| `auth` | Auth, OAuth, emailpass |
| `stock_location` | Warehouses |
| `notification` | Notifications |
| `search` | Search indexes |
| `cache` | Caching |
| `event_bus` | Event queue |
| `workflows` | Workflow engine |
| `locking` | Distributed locks |
| `file` | File storage |
| `draft_order` | Draft orders |
| `analytics` | Analytics tracking |

## Core Infrastructure Modules (Built-In)

| Module | Notes |
|---|---|
| `caching` | Next.js fetch cache + tags |
| `event_bus` | In-memory by default; falls back when no Redis |
| `workflow_engine` | In-memory by default |
| `locking` | In-memory by default |
| `notification` | Local event bus |
| `search` | MikroORM-based search indexes |

At boot the backend logs:
```
redisUrl not found. A fake redis instance will be used.
Local Event Bus installed. This is not recommended for production.
Locking module: Using "in-memory" as default.
```

This is expected without Redis. For production, set `REDIS_URL=redis://localhost:6379`.

## Storefront Integrations

### Stripe
- Packages: `@stripe/react-stripe-js` ^5.3.0, `@stripe/stripe-js` ^8.2.0
- Config: `NEXT_PUBLIC_STRIPE_KEY` in `apps/storefront/.env.local` (empty by default)

Flow:
1. Checkout fetches providers from `/store/payment-providers`
2. `PaymentWrapper` loads Stripe.js if Stripe is selected
3. `StripeWrapper` → `StripePaymentContainer` for card input
4. `sdk.store.payment.initiatePaymentSession()` starts the session
5. `cart.complete()` places the order
6. Stripe return handled by `src/app/api/payment-return/route.ts`

Supported payment provider ids (in `src/lib/constants.tsx`):
| Provider ID | Title |
|---|---|
| `pp_stripe_stripe` | Credit card |
| `pp_medusa-payments_default` | Credit card |
| `pp_stripe-ideal_stripe` | iDeal |
| `pp_stripe-bancontact_stripe` | Bancontact |
| `pp_paypal_paypal` | PayPal |
| `pp_system_default` | Manual Payment |

### Medusa JS SDK
- `@medusajs/js-sdk` v2.20.1
- Instantiated in `src/lib/config.ts`; monkey-patched to inject `x-medusa-locale` on every call.

### Medusa Icons
- `@medusajs/icons` v2.20.1 — used for provider icons etc.

## Admin Dashboard
- `@medusajs/admin-sdk` 2.20.1 — Widget/UI route extensions
- `@medusajs/admin-shared` 2.20.1 — Shared types
- `@medusajs/dashboard` 2.20.1 — Dashboard UI
- `@medusajs/ui` 4.2.3 — Admin UI components
- **No custom admin widgets or UI routes** in this install.

## Third-Party Service Dependencies

| Service | Purpose | Config |
|---|---|---|
| PostgreSQL | Primary database | `DATABASE_URL` |
| Redis (optional) | Event bus / cache / locking | `REDIS_URL` |
| Stripe (optional) | Payments | `NEXT_PUBLIC_STRIPE_KEY` |
| S3 (optional) | Image storage | `MEDUSA_CLOUD_S3_*` |

## Adding a Plugin Later

```bash
cd apps/backend
pnpm add @medusajs/plugin-<name>
```

```ts
// medusa-config.ts
module.exports = defineConfig({
  projectConfig: { /* … */ },
  plugins: [
    {
      resolve: "@medusajs/plugin-<name>",
      options: { /* plugin-specific */ },
    },
  ],
})
```

Then `pnpm exec medusa db:migrate` if the plugin ships migrations.

## Common Plugin Use Cases
- Email: `@medusajs/plugin-email-sendgrid`, `@medusajs/plugin-mailer`
- Analytics: `@medusajs/plugin-google-analytics`
- Payment: additional payment providers
- Shipping: carrier integrations
- Search: `@medusajs/plugin-search` (Meilisearch/Elasticsearch)
- Cache: Redis-based caching plugins