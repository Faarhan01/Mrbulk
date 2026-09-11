# Knowledge Base: MedusaJS Ecommerce Setup (medusa-js)

## Project Overview

This is a MedusaJS v2.20.1 DTC starter monorepo with a Next.js storefront. Backend is 100% upstream stock. Storefront has local patches documented in `customizations/frontend-fixes.md`.

**Key paths:**
- `apps/backend/` — Medusa backend (API, admin at `/app`, workflows, modules)
- `apps/storefront/` — Next.js storefront (pages, components, styles)
- `knowledgebase/site-structure/` — Detailed docs for each storefront area
- `knowledgebase/customizations/` — Fixes, known issues, rules, instructions

## Where Things Live

| Area | Path | Details in |
|---|---|---|
| Backend config | `apps/backend/medusa-config.ts` | `site-structure/backend.md` |
| Storefront routing | `apps/storefront/src/app/[countryCode]/(main)/` | `site-structure/storefront-routing.md` |
| Components | `apps/storefront/src/modules/common/components/` | `site-structure/components.md` |
| Account pages | `apps/storefront/src/modules/account/` | `site-structure/features.md` |
| Checkout/cart | `apps/storefront/src/modules/checkout/` | `site-structure/storefront-checkout-architecture.md` |
| Products/store | `apps/storefront/src/modules/product/` | `site-structure/store-and-products.md` |
| Global styles | `apps/storefront/src/styles/globals.css` | `site-structure/global-styles.md` |
| UI kit | `apps/storefront/src/modules/common/components/ui/` | `site-structure/ui-primitives-and-modals.md` |
| Data layer | `apps/storefront/src/lib/data/` | `site-structure/data-layer.md` |
| Backend fixes | `knowledgebase/customizations/backend-fixes.md` | (none — backend is stock) |
| Frontend fixes | `knowledgebase/customizations/frontend-fixes.md` | BUG-01 through BUG-16 |
| Known issues | `knowledgebase/customizations/known-issues.md` | Full bug catalog |
| Edit rules | `knowledgebase/customizations/rules.md` | Do's and don'ts |
| How to edit | `knowledgebase/customizations/instructions.md` | Component/feature/fix workflow |

## Quick Reference

- **Package manager:** pnpm v11.22.0 (detected from `package.json` `packageManager` field)
- **Node:** v24 LTS
- **DB:** PostgreSQL 18.6, database `medusa_swift_canyon`
- **Backend:** http://localhost:9000
- **Storefront:** http://localhost:8000
- **Admin:** http://localhost:9000/app
- **Admin creds:** admin@test.com / supersecret
- **Publishable key:** set in `apps/storefront/.env.local`

## Docs Index

- `site-structure/backend.md` — Backend layout, config, modules, workflows, DML
- `site-structure/storefront.md` — Storefront layout, modules, icons, env
- `site-structure/storefront-routing.md` — App Router, route groups, parallel slots
- `site-structure/components.md` — Component catalog and patterns
- `site-structure/storefront-checkout-architecture.md` — Cart, checkout, payment flow
- `site-structure/store-and-products.md` — Products, categories, PDP, refinement
- `site-structure/ui-primitives-and-modals.md` — Local UI kit, Modal API, forms
- `site-structure/api-routes.md` — File-based API routing conventions
- `site-structure/data-layer.md` — Server actions, SDK, caching
- `site-structure/features.md` — Feature flows (home, products, cart, account, orders)
- `site-structure/global-styles.md` — Tailwind, design tokens, theming
- `site-structure/plugins-and-integrations.md` — Stripe, built-in modules
- `site-structure/migration-scripts.md` — Seed script patterns
- `site-structure/testing.md` — Backend test layout, Jest config
- `customizations/frontend-fixes.md` — Applied storefront fixes (BUG-01–BUG-16)
- `customizations/backend-fixes.md` — Backend status (100% stock)
- `customizations/known-issues.md` — Full bug catalog with IDs and status
- `customizations/rules.md` — Editing rules and constraints
- `customizations/instructions.md` — How to make changes and verify
