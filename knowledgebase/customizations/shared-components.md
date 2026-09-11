# Shared Components

## Overview

This document defines the reusable shared components available in the storefront, where they live, how to use them, and the rules for extending them. Shared components are extracted from page-specific code into `src/modules/common/components/shared/` so they can be reused across multiple pages without duplication.

## Available Shared Components

### PageBanner

**Location**: `src/modules/common/components/shared/page-banner/index.tsx`  
**Type**: Client component (`"use client"`)  
**Purpose**: Unified page header with breadcrumb, title, description, badge, and optional actions.

#### Props

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `title` | `string` | Yes | — | Page title |
| `description` | `string` | No | — | Short description below the title |
| `badge` | `string` | No | — | Pill badge text |
| `onBack` | `() => void` | No | `router.back()` | Back button handler |
| `actions` | `React.ReactNode` | No | — | Action buttons/links rendered below description |
| `backLabel` | `string` | No | `"Home"` | Text for the breadcrumb back-link |

#### Usage

```tsx
import { PageBanner } from "@modules/common/components/shared/page-banner"

<PageBanner
  title="About Us"
  description="Learn more about our store."
  badge="Our Story"
  backLabel="Home"
/>
```

#### Rules

- Always provide `title`.
- Use `description` for a short summary below the title.
- Use `badge` for optional pill text above the title.
- The `backLabel` prop exists because different pages have different back-link semantics.
- Do not add inline styles. Use Tailwind utilities.
- Use Medusa UI tokens (`text-ui-fg-*`, `bg-ui-bg-*`, `border-ui-border-*`) for all colors.

#### Consumers

| Page | Path | Notes |
|---|---|---|
| About | `app/[countryCode]/(main)/about/page.tsx` | Full-width banner outside `content-container` |
| Contact | `app/[countryCode]/(main)/contact/page.tsx` | Full-width banner outside `content-container` |
| FAQ | `app/[countryCode]/(main)/faq/page.tsx` | Full-width banner outside `content-container` |
| Terms | `app/[countryCode]/(main)/terms/page.tsx` | Full-width banner outside `content-container` |
| Returns | `app/[countryCode]/(main)/returns/page.tsx` | Full-width banner outside `content-container` |
| Seller Policy | `app/[countryCode]/(main)/seller-policy/page.tsx` | Full-width banner outside `content-container` |
| Privacy | `app/[countryCode]/(main)/privacy/page.tsx` | Full-width banner outside `content-container` |
| Featured Products | `app/[countryCode]/(main)/featured/page.tsx` | Full-width banner outside `content-container` |
| Track Order | `app/[countryCode]/(main)/track-order/page.tsx` | Full-width banner outside `content-container` |
| Wishlist | `app/[countryCode]/(main)/wishlist/page.tsx` | Full-width banner outside `content-container` |
| Categories | `app/[countryCode]/(main)/categories/page.tsx` | Full-width banner outside `content-container` |
| Account | `app/[countryCode]/(main)/account/layout.tsx` via `AccountLayout` | Banner outside `content-container`; account nav/content wrapped separately |

#### Not Used On

- **Checkout** (`app/[countryCode]/(checkout)/checkout/page.tsx`) — checkout has its own minimal chrome.
- **Cart** (`app/[countryCode]/(main)/cart/page.tsx`) — cart has its own template.
- **Account dashboard pages** (`profile`, `orders`, `addresses`, `orders/details/[id]`) — the account layout already renders the banner; do not add another `PageBanner` inside these pages.

### PageBanner Width Rule

`PageBanner` renders its own full-width outer wrapper:

```tsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6 sm:space-y-8">
```

Because of this, **do not wrap `PageBanner` in `content-container` or any other centered/max-width wrapper**. If you do, the banner will be narrowed because it will inherit the parent’s max-width instead of using its own.

Correct pattern for normal pages:

```tsx
<div className="w-full">
  <PageBanner title="Page Title" description="Page description." />
  <div className="w-full flex justify-center px-8 py-12">
    <div className="max-w-3xl w-full">
      {/* page body */}
    </div>
  </div>
</div>
```

Account layout exception:

```tsx
<div data-testid="account-page">
  <PageBanner ... />
  <div className="content-container bg-white flex flex-col">
    <div className="max-w-7xl mx-auto w-full">
      {/* account nav + content */}
    </div>
  </div>
</div>
```

This keeps the banner full-width while constraining the account chrome below it.

### Account Page Consumer Notes

The account page (`modules/account/templates/account-layout.tsx`) uses `PageBanner` differently from other pages:

- The banner is rendered **outside** `content-container` so it can use its built-in full-width wrapper.
- The account nav, main content, and footer block are wrapped in a separate `content-container` + `max-w-7xl mx-auto w-full` div for readability.
- The welcome message was moved from `modules/account/components/overview/index.tsx` into the banner via `title` and `description` props.
- When the user is logged out, the banner shows `title="Account"` and `description="Please login or sign up to continue"`.

---

## Where to Use Shared Components

| Component | Current Consumers | Notes |
|---|---|---|
| `PageBanner` | About, Contact, FAQ, Terms, Returns, Seller Policy, Privacy, Featured Products, Track Order, Wishlist, Categories | Use for any page-level hero with breadcrumb |

### Account Page Consumer Notes

The account page (`modules/account/templates/account-layout.tsx`) uses `PageBanner` differently from other pages:

- The banner is rendered **outside** `content-container` so it can use its built-in full-width wrapper.
- The account nav, main content, and footer block are wrapped in a separate `content-container` + `max-w-7xl mx-auto w-full` div for readability.
- The welcome message was moved from `modules/account/components/overview/index.tsx` into the banner via `title` and `description` props.
- When the user is logged out, the banner shows `title="Account"` and `description="Please login or sign up to continue"`.

## Adding a New Shared Component

1. Create the folder under `src/modules/common/components/shared/<component-name>/index.tsx`.
2. Use `"use client"` only when the component needs hooks, event handlers, or browser APIs.
3. Define props with a TypeScript interface. Do not use `any`.
4. Keep the component small and focused. A component should do one thing.
5. Export both named and default exports if the component might be used in different import styles.
6. Document the component in this file after it is merged.

## Rules

- Do not modify shared components to suit a single page. If a page needs a variant, add a prop with a sensible default.
- Do not add JSDoc comments unless explicitly asked.
- Do not introduce new UI libraries. Reuse existing local UI primitives (`@modules/common/components/ui`) and Medusa preset tokens.
- All shared components must support dark mode via `dark:` variants.
- Use Medusa UI tokens (`text-ui-fg-*`, `bg-ui-bg-*`, `border-ui-border-*`) for all colors. Do not hardcode color values.
