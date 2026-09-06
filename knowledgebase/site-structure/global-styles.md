# Global Styles and Theming

## Overview
Tailwind CSS v3 with the **Medusa UI Preset** for design tokens. There are two overlapping token systems — Medusa's CSS variable utilities and a set of local typography/layout utilities.

## Global Stylesheet
**File**: `apps/storefront/src/styles/globals.css`

```css
@import "tailwindcss/base";
@import "tailwindcss/components";
@import "tailwindcss/utilities";
```

Legacy Tailwind v3 syntax (no `@theme` directive).

### Layout Utilities
```css
.content-container { max-width: 1440px; width: 100%; margin-left: auto; margin-right: auto; padding-left: 1.5rem; padding-right: 1.5rem; }
.contrast-btn { /* … */ }
```

### Typography Component Classes
| Class | Tailwind Size | Line Height | Weight |
|---|---|---|---|
| `text-xsmall-regular` / `text-xsmall-semi` | `text-[10px]` | `leading-4` (16) | normal / semibold |
| `text-small-regular` / `text-small-semi` | `text-xs` (12) | `leading-5` (20) | normal / semibold |
| `text-base-regular` / `text-base-semi` | `text-sm` (14) | `leading-6` (24) | normal / semibold |
| `text-large-regular` / `text-large-semi` | `text-base` (16) | `leading-6` (24) | normal / semibold |
| `text-xl-regular` / `text-xl-semi` | `text-2xl` (24) | `leading-[36px]` | normal / semibold |
| `text-2xl-regular` / `text-2xl-semi` | `text-[30px]` | `leading-[48px]` | normal / semibold |
| `text-3xl-regular` / `text-3xl-semi` | `text-[32px]` | `leading-[44px]` | normal / semibold |

### Form / Misc Utilities
```css
input:focus ~ label,
input:not(:placeholder-shown) ~ label {
  @apply -translate-y-2 text-xsmall-regular;
}
input:focus ~ label { @apply left-0; }

input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus,
textarea:-webkit-autofill, textarea:-webkit-autofill:hover, textarea:-webkit-autofill:focus,
select:-webkit-autofill, select:-webkit-autofill:hover, select:-webkit-autofill:focus {
  border: 1px solid #212121;
  -webkit-text-fill-color: #212121;
  -webkit-box-shadow: 0 0 0px 1000px #fff inset;
  transition: background-color 5000s ease-in-out 0s;
}

input[type="search"]::-webkit-search-decoration,
input[type="search"]::-webkit-search-cancel-button,
input[type="search"]::-webkit-search-results-button,
input[type="search"]::-webkit-search-results-decoration {
  -webkit-appearance: none;
}

.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar::-webkit-scrollbar-track { background-color: transparent; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
```

The floating-label pattern in this storefront is global (`input:focus ~ label`, **not** scoped to a `.floating-label-group`), so it relies on inputs that always have a `placeholder` attribute (even when empty) for `:not(:placeholder-shown)` to fire correctly. The autofill override covers `input`, `textarea`, and `select` in all three states (default / hover / focus).

## Tailwind Configuration
**File**: `apps/storefront/tailwind.config.js`

```js
module.exports = {
  darkMode: "class",
  presets: [require("@medusajs/ui-preset")],
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/modules/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      transitionProperty: {
        width: "width margin",
        height: "height",
        bg: "background-color",
        display: "display opacity",
        visibility: "visibility",
        padding: "padding-top padding-right padding-bottom padding-left",
      },
      // Note: `transitionProperty.width` is set to "width margin" (not just "width")
      // so it can be used with `transition-w-{N}` utilities without losing the margin.
      colors: {
        grey: {
          0: "#FFFFFF", 5: "#F9FAFB", 10: "#F3F4F6", 20: "#E5E7EB",
          30: "#D1D5DB", 40: "#9CA3AF", 50: "#6B7280", 60: "#4B5563",
          70: "#374151", 80: "#1F2937", 90: "#111827",
        },
      },
      borderRadius: {
        none: "0px", soft: "2px", base: "4px", rounded: "8px", large: "16px", circle: "9999px",
      },
      maxWidth: { "8xl": "100rem" },
      screens: {
        "2xsmall": "320px", xsmall: "512px", small: "1024px", medium: "1280px",
        large: "1440px", xlarge: "1680px", "2xlarge": "1920px",
      },
      fontSize: { "3xl": "2rem" },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Ubuntu", "sans-serif"],
      },
      keyframes: {
        ring: { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(360deg)" } },
        "fade-in-right": { "0%": { opacity: "0", transform: "translateX(10px)" }, "100%": { opacity: "1", transform: "translateX(0)" } },
        "fade-in-top": { "0%": { opacity: "0", transform: "translateY(-10px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "fade-out-top": { "0%": { height: "100%" }, "99%": { height: "0" }, "100%": { visibility: "hidden" } },
        "accordion-slide-up": { "0%": { height: "var(--radix-accordion-content-height)", opacity: "1" }, "100%": { height: "0", opacity: "0" } },
        "accordion-slide-down": { "0%": { "min-height": "0", "max-height": "0", opacity: "0" }, "100%": { "min-height": "var(--radix-accordion-content-height)", "max-height": "none", opacity: "1" } },
        enter: { "0%": { transform: "scale(0.9)", opacity: 0 }, "100%": { transform: "scale(1)", opacity: 1 } },
        leave: { "0%": { transform: "scale(1)", opacity: 1 }, "100%": { transform: "scale(0.9)", opacity: 0 } },
        "slide-in": { "0%": { transform: "translateY(-100%)" }, "100%": { transform: "translateY(0)" } },
      },
      animation: {
        ring: "ring 2.2s cubic-bezier(0.5, 0, 0.5, 1) infinite",
        "fade-in-right": "fade-in-right 0.3s cubic-bezier(0.5, 0, 0.5, 1) forwards",
        "fade-in-top": "fade-in-top 0.2s cubic-bezier(0.5, 0, 0.5, 1) forwards",
        "fade-out-top": "fade-out-top 0.2s cubic-bezier(0.5, 0, 0.5, 1) forwards",
        "accordion-open": "accordion-slide-down 300ms cubic-bezier(0.87, 0, 0.13, 1) forwards",
        "accordion-close": "accordion-slide-up 300ms cubic-bezier(0.87, 0, 0.13, 1) forwards",
        enter: "enter 200ms ease-out",
        "slide-in": "slide-in 1.2s cubic-bezier(.41,.73,.51,1.02)",
        leave: "leave 150ms ease-in forwards",
      },
    },
  },
  plugins: [require("tailwindcss-radix")()],
}
```

## Medusa Design Tokens (Tailwind Utilities)
Provided by `@medusajs/ui-preset` and used by both the admin and storefront.

### Text
`text-ui-fg-base`, `text-ui-fg-subtle`, `text-ui-fg-interactive`, `text-ui-fg-on-color`, `text-ui-fg-disabled`, `text-ui-fg-error`, `text-ui-fg-on-inverted`

### Background
`bg-ui-bg-base`, `bg-ui-bg-subtle`, `bg-ui-bg-component`, `bg-ui-bg-overlay`, `bg-ui-bg-field`, `bg-ui-bg-highlight`, `bg-ui-bg-interactive`, `bg-ui-bg-hover`, `bg-ui-bg-pressed`

### Border
`border-ui-border-base`, `border-ui-border-strong`, `border-ui-border-transparent`, `border-ui-border-interactive`, `border-ui-border-error`, `border-ui-border-danger`, `border-ui-border-menu-top`, `border-ui-border-menu-bot`

### Buttons
`bg-ui-button-neutral`, `bg-ui-button-neutral-hover`, `bg-ui-button-neutral-pressed`, `bg-ui-button-primary`, `bg-ui-button-primary-hover`, `bg-ui-button-danger`, `bg-ui-button-danger-hover`, `bg-ui-button-inverted`

### Tags
`bg-ui-tag-{green,red,blue,orange,purple,neutral}-{bg,border,text,icon}`, `bg-ui-tag-*-bg-hover`

### Dark Mode
`.dark` class on `<html>` swaps CSS variables. **No toggle UI** exists in this storefront.

## Root Layout
`src/app/[countryCode]/layout.tsx` sets `<html data-mode="light">`, imports `globals.css`, and sets `metadataBase` from `getBaseURL()`.

## PostCSS Configuration
**File**: `apps/storefront/postcss.config.js`
```js
module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } }
```

## Image Handling
**File**: `apps/storefront/next.config.js`
```js
const checkEnvVariables = require("./check-env-variables")

checkEnvVariables()

const S3_HOSTNAME = process.env.MEDUSA_CLOUD_S3_HOSTNAME
const S3_PATHNAME = process.env.MEDUSA_CLOUD_S3_PATHNAME

module.exports = {
  reactStrictMode: true,
  logging: { fetches: { fullUrl: true } },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "*.s3.*.amazonaws.com" },
      { protocol: "https", hostname: "*.s3.amazonaws.com" },
      ...(S3_HOSTNAME && S3_PATHNAME
        ? [{ protocol: "https", hostname: S3_HOSTNAME, pathname: S3_PATHNAME }]
        : []),
    ],
  },
}
```

All product images are remote (Medusa serves from S3 / seeded URLs). `check-env-variables.js` runs at startup to validate `NEXT_PUBLIC_*` keys.

## Build Configuration
- `next.config.js`: `images.unoptimized = true`, fetch logging enabled, ESLint + TypeScript errors **disabled during build** (default for the upstream starter).

## Sitemap
`next-sitemap.js` configured for sitemap generation across published routes.

## Notes
- This install uses **Medusa tokens** (`text-ui-fg-*`, `bg-ui-bg-*`, `border-ui-border-*`) throughout the standard starter.
- The earlier `medusajstore/myshop` install had drifted away from Medusa tokens in its hand-rolled UI kit (raw Tailwind greys); that drift does not exist here.