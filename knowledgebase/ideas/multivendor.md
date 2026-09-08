# Multivendor Marketplace Implementation Research

## 1. Goal
Add multivendor marketplace capabilities to the existing MedusaJS installation at `C:\Users\faarh\OneDrive\Documents\latest1\medusa-js` while keeping the architecture clean, upgrade-safe, and aligned with Medusa’s official extension patterns.

---

## 2. What MercurJS Does Well (Reference Implementation)

MercurJS is the most complete open-source multivendor layer built on MedusaJS. Its codebase (`mercurjs/mercur`) shows a production-grade implementation pattern.

### 2.1 Core Domain Model
- **Seller**: marketplace vendor entity with handle, status (`pending_approval`, `open`, `suspended`, `terminated`), address, payment details, `is_premium` flag, scheduled closures (`closed_from` / `closed_to`).
- **Member**: many-to-many user-to-seller relationship. A user can belong to multiple sellers and switch between them. Invitations via `invite-seller` / `accept-member-invite`.
- **Master Product**: single shared catalog, NOT owned by any seller. Sellers get an allowlist via `product-seller-link`.
- **Offer**: the actual sellable listing. Each offer ties a seller to a master product/variant with seller-specific SKU, price (pricing rule), inventory item, and shipping profile. Cart line items reference the purchased offer.
- **Order Group**: parent wrapper for a single customer cart split across multiple sellers. Contains per-seller child orders, exposes `display_id`, `seller_count`, `total`.
- **Commission**: rule-based fee structure matched across `product`, `product_type`, `product_collection`, `product_category`, `seller`. Most-specific-wins resolution. Uses BigNumber for financial precision.
- **Payout**: automated settlement to seller connected accounts (Stripe Connect out of box). Daily job at 1 AM UTC emits `payout.requested`.

### 2.2 Module Structure (`packages/core/src/modules/`)
MercurJS core plugin contains these marketplace modules:
- `seller` — registration, profiles, members, order groups
- `commission` — rates, rules, calculation
- `offer` — seller listings against master products
- `payout` — accounts, onboarding, payouts
- `product-attribute` — typed attribute catalog
- `product-edit` — change-request pipeline
- `order-group` — multi-vendor order wrapper
- `media`, `custom-fields`, `review`, `promotion-cost`, `admin-ui`, `vendor-ui`, `codegen`

### 2.3 Link-Heavy Architecture
MercurJS uses **dozens of module links** to wire the marketplace layer into Medusa commerce without touching core schemas:

**Seller-centric links:**
- `product-seller-link.ts` — allowlist which sellers may sell which products
- `order-seller-link.ts` — associate orders with sellers
- `offer-seller-link.ts` — link offers to sellers
- `payout-seller-link.ts` — link payouts to sellers
- `price-list-seller-link.ts` — seller-specific pricing
- `shipping-profile-seller-link.ts` — seller shipping configs
- `shipping-option-seller-link.ts` — seller shipping options
- `stock-location-seller-link.ts` — seller inventory locations
- `fulfillment-set-seller-link.ts` — seller fulfillment sets
- `service-zone-seller-link.ts` — seller service zones
- `inventory-item-seller-link.ts` — seller inventory items
- `campaign-seller-link.ts` — seller campaigns
- `promotion-seller-link.ts` — seller promotions
- `seller-customer-link.ts` — seller customer relationships
- `seller-customer-group-link.ts` — seller customer groups
- `seller-member-rbac-role.ts` — seller role assignments
- `seller-review.ts` — seller reviews
- `seller-payout-account-link.ts` — seller payout accounts

**Offer-centric links:**
- `offer-product-link.ts` — offer to master product
- `offer-variant-link.ts` — offer to variant
- `offer-inventory-item-link.ts` — offer inventory
- `offer-price-link.ts` — offer pricing
- `offer-shipping-profile-link.ts` — offer shipping

**Order flow links:**
- `order-group-cart-link.ts` — order group to originating cart
- `order-group-order-link.ts` — order group to child orders
- `order-line-item-offer-link.ts` — line items to offers
- `order-payout-link.ts` — orders to payouts
- `order-review.ts` — order reviews
- `cart-line-item-offer-link.ts` — cart line items to offers

### 2.4 Workflow Patterns
MercurJS uses Medusa’s workflow engine extensively:
- **Seller lifecycle**: create, approve, suspend, unsuspend, terminate
- **Member invites**: invite-seller, accept-member-invite
- **Commission flows**: batch-commission-rules, refresh-order-commission-lines
- **Payout pipeline**: capture-check job (every 15 min) → authorized payment capture → daily `payout.requested` → `createPayoutWorkflow`
- **Order splitting**: complete cart → create OrderGroup → split by seller → create per-seller orders → calculate commissions → split payment
- **Product change pipeline**: immutable `ProductChange` records with `UPDATE`, `VARIANT_*`, `ATTRIBUTE_*`, `STATUS_CHANGE` actions

All workflows support **compensation** (automatic rollback on failure) and expose **hooks** as extension points.

### 2.5 Frontend Architecture
MercurJS uses **separate Vite apps** for each dashboard:

```
apps/
  admin-test/   — Vite on port 7000, mounts @mercurjs/admin
  vendor/       — Vite on port 7001, mounts @mercurjs/vendor
  api/          — Medusa 2.x server
  docs/         — Mintlify documentation site
```

**Package structure:**
- `packages/admin` — operator dashboard (~39 page folders)
- `packages/vendor` — seller dashboard (~24 page folders)
- `packages/dashboard-shared` — shared React primitives (forms, tables, modals, layout)
- `packages/dashboard-sdk` — Vite plugin for file-based routing and block injection
- `packages/client` — typed API client using recursive Proxy pattern
- `packages/types` — shared TypeScript contracts

**Key frontend patterns:**
- File-based routing via `@mercurjs/dashboard-sdk` scanning `src/routes/**/page.tsx`
- Compound component pattern: every page exports `Object.assign(Root, { Header, HeaderTitle, HeaderActions, DataTable, ... })`
- TanStack Query for data fetching with `queryKeysFactory` for cache keys
- `RouteFocusModal` for create flows, `RouteDrawer` for edit flows
- `TabbedForm` for multi-step creation
- Strict i18n via `useTranslation()` / `t(key)`
- Only `@medusajs/ui` components allowed as UI library
- Only `@medusajs/icons` for icons
- Medusa UI color tokens only (no raw hex/rgb)

---

## 3. How MercurJS Handles the Storefront

MercurJS is **headless** — it does not prescribe a storefront. The Store API (`/store/*`) is a separate surface that any frontend can consume.

### 3.1 Store API
- Exposes marketplace discovery: sellers, offers, products
- Multi-vendor cart that spans sellers
- Cart completion triggers the split-order workflow
- Seller-scoped product visibility based on `product-seller-link`

### 3.2 Demo / Template Storefront
MercurJS provides `templates/basic` which includes:
- Next.js B2C marketplace storefront (optional during scaffolding)
- Multi-vendor catalog browsing
- Offer-based add-to-cart
- Checkout that works across multiple sellers
- Storefront cache revalidation on product/offer events

### 3.3 Key Insight for Our Project
We already have a Next.js storefront in `apps/storefront/`. We can either:
1. Keep our existing DTC starter and extend it for marketplace browsing
2. Replace/augment it with MercurJS’s storefront template patterns
3. Build marketplace-specific pages alongside existing ones

---

## 4. Official MedusaJS Marketplace Recipe

Medusa’s official docs (`docs.medusajs.com/resources/recipes/marketplace`) prescribe:

### 4.1 Custom Marketplace Module
Create `src/modules/marketplace` with:
- `Vendor` data model (handle, name, logo, etc.)
- `VendorAdmin` data model (first_name, last_name, email, vendor relation)
- Service extending `MedusaService` for CRUD
- Module definition exported as `MARKETPLACE_MODULE`

### 4.2 Module Links
Define links between Vendor and Product/Order:
```ts
export default defineLink(
  MarketplaceModule.linkable.vendor,
  { linkable: ProductModule.linkable.product.id, isList: true }
)
```

### 4.3 Workflow Hooks for Auto-Linking
Use Medusa’s exposed hooks:
- `createProductsWorkflow.hooks.productsCreated`
- `createOrdersWorkflow.hooks.orderCreated`

Hook into these to automatically link new products/orders to the logged-in vendor’s store.

### 4.4 Middleware for Data Scoping
Add middleware chain:
1. `registerLoggedInUser` — resolves and caches the logged-in user
2. `addStoreIdToFilterableFields` — reads user-store link, injects `store_id` into filterable fields
3. `maybeApplyLinkFilter` — translates store_id into join filters against link tables
4. `moveIdsToQueryFromFilterableFields` — moves filterable IDs into query params

This ensures vendors only see their own products/orders without modifying core handlers.

### 4.5 Order Splitting
Replicate/override the cart completion workflow to split one cart into per-vendor orders. Medusa’s workflow engine supports compensation/rollback.

### 4.6 Custom Actor Types
Register a custom `vendor` actor type in auth so vendor admins authenticate separately from super admins.

---

## 5. Local Project Context (`medusa-js`)

### 5.1 Current State
From `knowledgebase/context.md` and file inspection:
- **Backend**: 100% upstream stock. No custom modules, workflows, links, or API routes beyond scaffolded placeholders.
- **Storefront**: Next.js 15.5.21 with Next.js Starter DTC template. Has 9 local patches for bugs.
- **Medusa Version**: 2.20.1
- **Package Manager**: pnpm 11.22.0
- **Node**: v24.18.0
- **Database**: PostgreSQL 18.6, `medusa_swift_canyon`
- **Structure**: Turborepo monorepo with `apps/backend` and `apps/storefront`

### 5.2 Backend Extension Points Available
```
apps/backend/src/
  modules/      — empty README, ready for custom modules
  workflows/    — empty README, ready for workflows
  links/        — empty README, ready for module links
  api/
    admin/custom/route.ts  — placeholder
    store/custom/route.ts  — placeholder
  subscribers/  — empty README
  jobs/         — empty README
```

### 5.3 medusa-config.ts
Current config is minimal — just `projectConfig` with database URL and CORS. No plugins, no custom modules registered. This is the perfect blank slate for adding marketplace functionality.

---

## 6. Recommended Implementation Approach

### 6.1 Strategy: Native Medusa Implementation (Not MercurJS Fork)

**Reasoning:**
- MercurJS is a full marketplace platform with its own release cycle, version pinning (`@medusajs/framework` 2.20.1), and architectural assumptions
- MercurJS 2.0+ uses a block-based model where code is copied into your project — but it’s designed for their CLI/tooling
- Our existing `medusa-js` project has a working Next.js storefront and backend
- Directly implementing the MedusaJS marketplace recipe gives us full control and avoids MercurJS upgrade coupling

### 6.2 Phase 1: Foundation (Backend)

**Step 1: Create Marketplace Module**
```
apps/backend/src/modules/marketplace/
  models/
    vendor.ts
    vendor-admin.ts
    store.ts
  service.ts
  index.ts
```

Data models:
- `Store`: the vendor’s storefront entity (name, handle, description, status)
- `VendorAdmin`: links a Medusa user to a store with a role
- Optionally: `Seller` if we want separate from Medusa’s built-in Store concept

**Step 2: Define Module Links**
Create `apps/backend/src/links/`:
- `store-product-link.ts` — link Store to Product
- `store-order-link.ts` — link Store to Order
- `store-customer-link.ts` — link Store to Customer
- `store-user-link.ts` — link Store to User (for vendor admins)
- `store-inventory-link.ts` — link Store to InventoryItem
- `store-shipping-profile-link.ts` — link Store to ShippingProfile

Run `pnpm exec medusa db:generate marketplace` and `pnpm exec medusa db:migrate`.

**Step 3: Create Vendor Workflow**
- `create-store-workflow` — creates store + vendor admin + links user
- `approve-store-workflow` — operator approves vendor
- `suspend-store-workflow` — operator suspends vendor

**Step 4: Expose API Routes**
```
apps/backend/src/api/
  admin/
    stores/          — CRUD for marketplace operators
    vendors/         — vendor management
    marketplace/     — commission rules, payouts
  vendor/
    products/        — vendor-scoped product management
    orders/          — vendor-scoped order management
    store/           — vendor store settings
  store/
    sellers/         — public seller directory
    sellers/[handle]/ — public seller storefront
```

**Step 5: Middleware for Scoping**
Create `apps/backend/src/api/middlewares.ts`:
- Vendor auth middleware for `/vendor/*` routes
- Store-scoping middleware for vendor API routes
- Operator bypass for `/admin/*` routes

**Step 6: Order Splitting Workflow**
Override or extend the cart completion workflow:
1. Complete cart creates OrderGroup
2. Group cart line items by store
3. Create per-store orders
4. Calculate commission lines per order
5. Link orders to OrderGroup

**Step 7: Commission Module**
Create `apps/backend/src/modules/commission/`:
- CommissionRule model (product, category, seller-specific rates)
- CommissionCalculation workflow
- Auto-calculate on order placement

### 6.3 Phase 2: Admin Dashboard Extensions

Use Medusa’s Admin UI extension points:
- **Widgets**: Add marketplace overview widgets to the admin dashboard
- **UI Routes**: Add `/admin/stores`, `/admin/vendors`, `/admin/commissions` pages
- **Settings Pages**: Add marketplace configuration

Example structure:
```
apps/backend/src/admin/
  widgets/
    marketplace-stats.tsx
  pages/
    stores/
      store-list.tsx
      store-detail.tsx
    vendors/
      vendor-list.tsx
    commissions/
      commission-rates.tsx
```

### 6.4 Phase 3: Vendor Dashboard

Build a separate vendor dashboard (similar to MercurJS’s `packages/vendor`):
- Option A: Extend Medusa Admin with vendor-scoped customizations
- Option B: Build a separate React/Vite app (like MercurJS)
- Option C: Add vendor pages within the existing storefront under `/seller/*`

**Recommended for our setup:** Start with Option A (admin extensions) for MVP, then evolve to Option C or B as needs grow.

### 6.5 Phase 4: Storefront Marketplace Features

Extend the existing Next.js storefront:
- Seller directory page (`/sellers`)
- Seller storefront pages (`/sellers/[handle]`)
- Multi-vendor cart with seller grouping
- Offer-based product pages
- Seller badges on product pages

### 6.6 Phase 5: Payouts & Payments

- Integrate Stripe Connect (or alternative) for vendor payouts
- Create payout workflow
- Add payout tracking to vendor dashboard
- Scheduled job for payout processing

---

## 7. Key Implementation Files to Create

### Backend
```
apps/backend/src/modules/marketplace/
  models/vendor.ts
  models/store.ts
  models/vendor-admin.ts
  service.ts
  index.ts

apps/backend/src/modules/commission/
  models/commission-rule.ts
  service.ts
  index.ts

apps/backend/src/links/
  store-product-link.ts
  store-order-link.ts
  store-customer-link.ts
  store-user-link.ts
  store-inventory-item-link.ts
  store-shipping-profile-link.ts

apps/backend/src/workflows/marketplace/
  create-store/
    steps/create-store.ts
    steps/create-vendor-admin.ts
    index.ts
  approve-store/
    steps/approve-store.ts
    index.ts
  split-order/
    steps/group-items-by-store.ts
    steps/create-store-orders.ts
    steps/calculate-commissions.ts
    index.ts

apps/backend/src/api/
  middlewares.ts
  admin/stores/route.ts
  admin/stores/[id]/route.ts
  vendor/products/route.ts
  vendor/orders/route.ts
  store/sellers/route.ts
  store/sellers/[handle]/route.ts

apps/backend/src/subscribers/
  marketplace/
    order-completed.ts
    payout-requested.ts
```

### Frontend
```
apps/storefront/src/app/[countryCode]/(main)/sellers/page.tsx
apps/storefront/src/app/[countryCode]/(main)/sellers/[handle]/page.tsx
apps/storefront/src/modules/seller/
  components/seller-card.tsx
  components/seller-list.tsx
  templates/seller-storefront.tsx
```

---

## 8. Plugin Alternative: `@techlabi/medusa-marketplace-plugin`

### 8.1 What It Provides
- Super admin role with vendor impersonation
- Store creation workflow
- Entity separation via module links (customer-store, order-store, price-list-store, product-store, shipping-profile-store, stock-location-store, user-store)
- Admin dashboard widgets
- Vendor-specific product/order scoping in admin

### 8.2 Limitations
- Community plugin (~63 stars), smaller maintainer team
- Requires `postinstall` patch script that modifies admin internals
- Tightly coupled to Medusa’s internal admin structure — may break on minor Medusa upgrades
- No built-in payouts, commissions, or order splitting
- No vendor dashboard — vendors use scoped admin views
- Less flexible than MercurJS for complex marketplace logic

### 8.3 When to Use
- Prototyping/MVP where speed matters more than long-term control
- Simple marketplace with basic vendor separation needs
- When you want to avoid building the full multivendor stack yourself

---

## 9. Marketing & Advertising Integrations

### 9.1 Current Landscape
There is **no dedicated Google Ads plugin** for MedusaJS. The existing community marketing plugins cover:

| Plugin | Purpose | Status |
|--------|---------|--------|
| `@variablevic/google-analytics-medusa` | GA4 ecommerce tracking via Measurement Protocol | Active |
| `medentem/klaviyo-medusa` | Klaviyo email marketing + customer sync | Active |
| `@tsc_tech/medusa-plugin-product-seo` | Product/category SEO metadata | Active |
| `erickirt/medusa-marketing` | Action-based email framework | v1 only, needs migration |

### 9.2 Google Ads Integration Options

**Option A: Build Custom Subscriber/Workflow**
- Use Medusa’s event system to push conversion events to Google Ads API
- Subscribe to `order.placed`, `cart.updated`, `product.viewed`
- Fan out to multiple ad platforms via parallelized workflow steps
- Example pattern from docs:
  ```ts
  export const addSubscriberToAudiencesWorkflow = createWorkflow(...)
  ```
- Pros: Full control, works with any ad platform
- Cons: Requires development effort

**Option B: Frontend Pixel Injection**
- Add Google Ads/GTM scripts to storefront
- Use client-side event tracking
- Simplest but most fragile
- Good for MVP, insufficient for proper conversion tracking

**Option C: GTM DataLayer Bridge**
- Feature request exists for `@medusajs/gtm-datalayer` package
- Would map Medusa events to GA4 dataLayer events
- Then GTM routes to GA4, Meta Pixel, Google Ads, TikTok, etc.
- Not yet implemented — opportunity to build

### 9.3 Recommended Approach
Build a small internal Medusa plugin (`apps/backend/src/plugins/marketing/`) that:
1. Subscribes to key commerce events
2. Transforms Medusa data to ad-platform formats
3. Pushes to Google Ads Conversions API, Meta Conversions API, etc.
4. Uses Medusa’s workflow engine for retry/compensation

This keeps the integration maintainable and platform-agnostic.

---

## 10. Architecture Comparison: Our Project vs MercurJS

| Aspect | Our `medusa-js` | MercurJS |
|--------|-----------------|----------|
| **Backend** | Single Medusa app, stock | Medusa + `@mercurjs/core` plugin |
| **Multi-vendor** | None (DTC only) | Full marketplace layer |
| **Modules** | None custom | 10+ marketplace modules |
| **Links** | None | 35+ module links |
| **Admin** | Standard Medusa Admin | `@mercurjs/admin` (39 pages) |
| **Vendor Panel** | None | `@mercurjs/vendor` (24 pages) |
| **Storefront** | Next.js DTC starter | Headless, any frontend |
| **Payouts** | None | Stripe Connect built-in |
| **Commissions** | None | Rule-based, BigNumber precision |
| **Order Splitting** | None | OrderGroup + per-seller orders |
| **Product Model** | Single-seller | Master product + Offer model |
| **Auth** | Admin + Customer | Admin + Vendor + Customer |
| **Package Manager** | pnpm | Bun |
| **Frontend Stack** | Next.js + Tailwind | React + Vite + Medusa UI |

---

## 11. Upgrade & Maintenance Considerations

### 11.1 Staying on Medusa Core
- Use **modules** for custom data models — isolated, upgrade-safe
- Use **module links** instead of foreign keys — schemas stay stable
- Use **workflow hooks** instead of modifying core workflows
- Use **middleware** for request scoping instead of modifying handlers
- Avoid forking or patching Medusa core packages

### 11.2 Medusa Version Tracking
- Current: 2.20.1
- MercurJS tracks closely: v2.3.1 bumped Medusa from 2.17.2 → 2.18.0
- Medusa releases ~monthly minor versions with breaking changes
- Our custom code should target Medusa’s public APIs, not internals

### 11.3 Migration Path if Switching to MercurJS Later
If we outgrow our custom implementation:
1. Export our marketplace data model
2. Create a fresh `bun create mercur-app@latest`
3. Map our custom logic to MercurJS blocks/workflows
4. Port data via migration scripts
5. MercurJS 2.0+ uses code blocks copied into project, making porting easier

---

## 12. Recommended Next Steps

1. **Validate requirements** — confirm multivendor scope (simple vendor separation vs full marketplace with commissions/payouts)
2. **Create marketplace module** — start with `Store` + `VendorAdmin` models and basic CRUD
3. **Define core links** — store-product, store-order, store-user
4. **Build vendor onboarding workflow** — create store, invite admin, set auth metadata
5. **Add vendor API routes** — scoped product/order management
6. **Implement order splitting** — extend cart completion for multi-vendor carts
7. **Add admin marketplace pages** — vendor management, commission rules
8. **Extend storefront** — seller directory, multi-vendor cart
9. **Add marketing integrations** — GA4, email, eventually Google Ads

---

## 13. Sources

- MedusaJS Marketplace Recipe: https://docs.medusajs.com/resources/recipes/marketplace/examples/vendors
- MercurJS Architecture Doc: https://github.com/mercurjs/mercur/blob/main/docs/ARCHITECTURE.md
- MercurJS UI Architecture: https://github.com/mercurjs/mercur/blob/main/docs/UI-ARCHITECTURE.md
- MercurJS Product Description: https://github.com/mercurjs/mercur/blob/main/docs/PRODUCT.md
- MercurJS Links: https://github.com/mercurjs/mercur/tree/main/packages/core/src/links
- Local project knowledgebase: `C:\Users\faarh\OneDrive\Documents\latest1\medusa-js\knowledgebase\context.md`
- MedusaJS marketing plugin landscape: npm, GitHub searches
- Community marketplace plugin: https://github.com/Tech-Labi/medusa-marketplace-plugin

---

*Research compiled: 2026-09-07*
*Based on MedusaJS v2.20.1, MercurJS v2.3.1, and local project inspection*
