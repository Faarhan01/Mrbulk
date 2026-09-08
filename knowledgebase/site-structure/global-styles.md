# Global Styles and Theming

## Overview

The storefront uses **Tailwind CSS v3** with the **Medusa UI Preset** (`@medusajs/ui-preset` v2.20.1) as its design system foundation. There are three overlapping style layers:

1. **Medusa UI Preset tokens** — CSS custom properties (`--fg-base`, `--bg-component`, etc.) mapped to Tailwind utility classes (`text-ui-fg-base`, `bg-ui-bg-component`, etc.). These are the primary design tokens.
2. **Local globals.css** — `@layer utilities` and `@layer components` for one-off helpers (`.no-scrollbar`, `.content-container`, floating-label behavior, the local `text-*-regular`/`text-*-semi` scale).
3. **tailwind.config.js extensions** — local `grey` color scale, `borderRadius`, responsive `screens`, custom `keyframes`/`animation`, `transitionProperty`, and the `tailwindcss-radix` plugin.

The preset is the source of truth for colors, shadows, and the `txt-*` typography classes. Local overrides in `tailwind.config.js` and `globals.css` extend it without modifying the preset package.

---

## How the Medusa UI Preset Works

### What it is

`@medusajs/ui-preset` is a **Tailwind CSS preset** (not a React component library). It is auto-generated from Medusa's Figma design tokens. It does three things:

1. **Injects CSS custom properties** into `:root` (light) and `.dark` (dark) via `addBase`
2. **Extends Tailwind's theme** with color, boxShadow, fontFamily, keyframes, and animation tokens via the preset's second argument
3. **Registers component-level CSS classes** (`@layer components`) for typography (`.txt-*`, `.h1-webs`, etc.)

### How it's loaded

`apps/storefront/tailwind.config.js`:
```js
const path = require("path")

module.exports = {
  darkMode: "class",
  presets: [require("@medusajs/ui-preset")],
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/modules/**/*.{js,ts,jsx,tsx}",
  ],
  // ...
}
```

The preset file (`node_modules/@medusajs/ui-preset/src/preset.ts`) exports:
```js
const preset = {
  content: [],
  plugins: [plugin, require("tailwindcss-animate")],
}
```

So `presets: [require("@medusajs/ui-preset")]` loads:
- The preset's plugin (CSS variables + theme extensions)
- `tailwindcss-animate` (animation utilities like `animate-in`, `animate-out`)

**Note**: The storefront's `content` array does **not** include `./node_modules/@medusajs/ui/dist/**/*.{js,jsx,ts,tsx}`. This is acceptable because the preset's plugin registers its own CSS classes globally via `addComponents(typography)`, and the Tailwind theme extensions are available regardless of content scanning. However, if you add custom Medusa UI component imports from `@medusajs/ui`, you should add the `node_modules` path to `content` to avoid purging.

### Dark mode strategy

The preset supports both `class` and `media` dark mode strategies. This storefront uses `darkMode: "class"`:

- **Light mode** (default): CSS variables are set on `:root`
- **Dark mode** (`.dark` class on `<html>`): CSS variables are overridden on `.dark`

When `darkMode: "media"` is used, the preset instead emits a `@media (prefers-color-scheme: dark)` block. This storefront does **not** use media queries for dark mode.

---

## CSS Variable Token System

The preset defines ~90 CSS custom properties per theme. They are mapped to Tailwind classes via the preset's `theme.extend.colors` and `theme.extend.boxShadow` extensions.

### Token naming convention

CSS variables use **kebab-case** without prefixes. Tailwind classes use **dotted** namespaces:

| CSS variable | Tailwind class |
|---|---|
| `--fg-base` | `text-ui-fg-base` |
| `--bg-base` | `bg-ui-bg-base` |
| `--border-base` | `border-ui-border-base` |
| `--borders-base` | `shadow-borders-base` |
| `--elevation-card-rest` | `shadow-elevation-card-rest` |

### Text / Foreground (`--fg-*`)

| CSS variable | Light value | Dark value | Tailwind class |
|---|---|---|---|
| `--fg-base` | `rgba(24, 24, 27, 1)` | `rgba(244, 244, 245, 1)` | `text-ui-fg-base` |
| `--fg-subtle` | `rgba(82, 82, 91, 1)` | `rgba(161, 161, 170, 1)` | `text-ui-fg-subtle` |
| `--fg-interactive` | `rgba(59, 130, 246, 1)` | `rgba(96, 165, 250, 1)` | `text-ui-fg-interactive` |
| `--fg-interactive-hover` | `rgba(37, 99, 235, 1)` | `rgba(147, 197, 253, 1)` | `text-ui-fg-interactive-hover` |
| `--fg-error` | `rgba(225, 29, 72, 1)` | `rgba(251, 113, 133, 1)` | `text-ui-fg-error` |
| `--fg-disabled` | `rgba(161, 161, 170, 1)` | `rgba(82, 82, 91, 1)` | `text-ui-fg-disabled` |
| `--fg-muted` | `rgba(113, 113, 122, 1)` | `rgba(113, 113, 122, 1)` | `text-ui-fg-muted` |
| `--fg-on-color` | `rgba(255, 255, 255, 1)` | `rgba(255, 255, 255, 1)` | `text-ui-fg-on-color` |
| `--fg-on-inverted` | `rgba(255, 255, 255, 1)` | `rgba(24, 24, 27, 1)` | `text-ui-fg-on-inverted` |

### Background (`--bg-*`)

| CSS variable | Light value | Dark value | Tailwind class |
|---|---|---|---|
| `--bg-base` | `rgba(255, 255, 255, 1)` | `rgba(33, 33, 36, 1)` | `bg-ui-bg-base` |
| `--bg-base-hover` | `rgba(244, 244, 245, 1)` | `rgba(39, 39, 42, 1)` | `bg-ui-bg-base-hover` |
| `--bg-base-pressed` | `rgba(228, 228, 231, 1)` | `rgba(63, 63, 70, 1)` | `bg-ui-bg-base-pressed` |
| `--bg-subtle` | `rgba(250, 250, 250, 1)` | `rgba(24, 24, 27, 1)` | `bg-ui-bg-subtle` |
| `--bg-subtle-hover` | `rgba(244, 244, 245, 1)` | `rgba(33, 33, 36, 1)` | `bg-ui-bg-subtle-hover` |
| `--bg-subtle-pressed` | `rgba(228, 228, 231, 1)` | `rgba(39, 39, 42, 1)` | `bg-ui-bg-subtle-pressed` |
| `--bg-component` | `rgba(250, 250, 250, 1)` | `rgba(39, 39, 42, 1)` | `bg-ui-bg-component` |
| `--bg-component-hover` | `rgba(244, 244, 245, 1)` | `rgba(255, 255, 255, 0.1)` | `bg-ui-bg-component-hover` |
| `--bg-component-pressed` | `rgba(228, 228, 231, 1)` | `rgba(255, 255, 255, 0.16)` | `bg-ui-bg-component-pressed` |
| `--bg-field` | `rgba(250, 250, 250, 1)` | `rgba(255, 255, 255, 0.04)` | `bg-ui-bg-field` |
| `--bg-field-hover` | `rgba(244, 244, 245, 1)` | `rgba(255, 255, 255, 0.08)` | `bg-ui-bg-field-hover` |
| `--bg-field-component` | `rgba(255, 255, 255, 1)` | `rgba(33, 33, 36, 1)` | `bg-ui-bg-field-component` |
| `--bg-field-component-hover` | `rgba(250, 250, 250, 1)` | `rgba(39, 39, 42, 1)` | `bg-ui-bg-field-component-hover` |
| `--bg-interactive` | `rgba(59, 130, 246, 1)` | `rgba(96, 165, 250, 1)` | `bg-ui-bg-interactive` |
| `--bg-disabled` | `rgba(244, 244, 245, 1)` | `rgba(39, 39, 42, 1)` | `bg-ui-bg-disabled` |
| `--bg-overlay` | `rgba(24, 24, 27, 0.4)` | `rgba(24, 24, 27, 0.72)` | `bg-ui-bg-overlay` |
| `--bg-highlight` | `rgba(239, 246, 255, 1)` | `rgba(23, 37, 84, 1)` | `bg-ui-bg-highlight` |
| `--bg-highlight-hover` | `rgba(219, 234, 254, 1)` | `rgba(30, 58, 138, 1)` | `bg-ui-bg-highlight-hover` |
| `--bg-switch-off` | `rgba(228, 228, 231, 1)` | `rgba(63, 63, 70, 1)` | `bg-ui-bg-switch-off` |
| `--bg-switch-off-hover` | `rgba(212, 212, 216, 1)` | `rgba(82, 82, 91, 1)` | `bg-ui-bg-switch-off-hover` |

### Border (`--border-*`)

| CSS variable | Light value | Dark value | Tailwind class |
|---|---|---|---|
| `--border-base` | `rgba(228, 228, 231, 1)` | `rgba(255, 255, 255, 0.08)` | `border-ui-border-base` |
| `--border-strong` | `rgba(212, 212, 216, 1)` | `rgba(255, 255, 255, 0.16)` | `border-ui-border-strong` |
| `--border-interactive` | `rgba(59, 130, 246, 1)` | `rgba(96, 165, 250, 1)` | `border-ui-border-interactive` |
| `--border-danger` | `rgba(190, 18, 60, 1)` | `rgba(190, 18, 60, 1)` | `border-ui-border-danger` |
| `--border-error` | `rgba(225, 29, 72, 1)` | `rgba(251, 113, 133, 1)` | `border-ui-border-error` |
| `--border-transparent` | `rgba(255, 255, 255, 0)` | `rgba(255, 255, 255, 0)` | `border-ui-border-transparent` |
| `--border-menu-top` | `rgba(228, 228, 231, 1)` | `rgba(33, 33, 36, 1)` | `border-ui-border-menu-top` |
| `--border-menu-bot` | `rgba(255, 255, 255, 1)` | `rgba(255, 255, 255, 0.08)` | `border-ui-border-menu-bot` |

### Button (`--button-*`)

| CSS variable | Light value | Dark value | Tailwind class |
|---|---|---|---|
| `--button-neutral` | `rgba(255, 255, 255, 1)` | `rgba(255, 255, 255, 0.04)` | `bg-ui-button-neutral` |
| `--button-neutral-hover` | `rgba(244, 244, 245, 1)` | `rgba(255, 255, 255, 0.08)` | `bg-ui-button-neutral-hover` |
| `--button-neutral-pressed` | `rgba(228, 228, 231, 1)` | `rgba(255, 255, 255, 0.12)` | `bg-ui-button-neutral-pressed` |
| `--button-inverted` | `rgba(39, 39, 42, 1)` | `rgba(82, 82, 91, 1)` | `bg-ui-button-primary` |
| `--button-inverted-hover` | `rgba(63, 63, 70, 1)` | `rgba(113, 113, 122, 1)` | `bg-ui-button-primary-hover` |
| `--button-inverted-pressed` | `rgba(82, 82, 91, 1)` | `rgba(161, 161, 170, 1)` | `bg-ui-button-primary-pressed` |
| `--button-danger` | `rgba(225, 29, 72, 1)` | `rgba(159, 18, 57, 1)` | `bg-ui-button-danger` |
| `--button-danger-hover` | `rgba(190, 18, 60, 1)` | `rgba(190, 18, 60, 1)` | `bg-ui-button-danger-hover` |
| `--button-danger-pressed` | `rgba(159, 18, 57, 1)` | `rgba(225, 29, 72, 1)` | `bg-ui-button-danger-pressed` |
| `--button-transparent` | `rgba(255, 255, 255, 0)` | `rgba(255, 255, 255, 0)` | `bg-ui-button-inverted` |
| `--button-transparent-hover` | `rgba(244, 244, 245, 1)` | `rgba(255, 255, 255, 0.08)` | `bg-ui-button-inverted-hover` |
| `--button-transparent-pressed` | `rgba(228, 228, 231, 1)` | `rgba(255, 255, 255, 0.12)` | `bg-ui-button-inverted-pressed` |

### Tag (`--tag-*`)

Six color variants: `green`, `red`, `blue`, `orange`, `purple`, `neutral`. Each has `bg`, `bg-hover`, `border`, `text`, and `icon` sub-tokens.

Example (green):
| CSS variable | Light value | Dark value | Tailwind class |
|---|---|---|---|
| `--tag-green-bg` | `rgba(209, 250, 229, 1)` | `rgba(2, 44, 34, 1)` | `bg-ui-tag-green-bg` |
| `--tag-green-bg-hover` | `rgba(167, 243, 208, 1)` | `rgba(6, 78, 59, 1)` | `bg-ui-tag-green-bg-hover` |
| `--tag-green-border` | `rgba(167, 243, 208, 1)` | `rgba(6, 78, 59, 1)` | `border-ui-tag-green-border` |
| `--tag-green-text` | `rgba(6, 95, 70, 1)` | `rgba(52, 211, 153, 1)` | `text-ui-tag-green-text` |
| `--tag-green-icon` | `rgba(16, 185, 129, 1)` | `rgba(16, 185, 129, 1)` | `text-ui-tag-green-icon` |

### Contrast (`--contrast-*`)

Used for high-contrast UI elements (e.g., inverted backgrounds, menu borders):

| CSS variable | Light value | Dark value | Tailwind class |
|---|---|---|---|
| `--contrast-bg-base` | `rgba(24, 24, 27, 1)` | `rgba(39, 39, 42, 1)` | `bg-ui-contrast-bg-base` |
| `--contrast-bg-base-hover` | `rgba(39, 39, 42, 1)` | `rgba(63, 63, 70, 1)` | `bg-ui-contrast-bg-base-hover` |
| `--contrast-bg-base-pressed` | `rgba(63, 63, 70, 1)` | `rgba(82, 82, 91, 1)` | `bg-ui-contrast-bg-base-pressed` |
| `--contrast-bg-subtle` | `rgba(39, 39, 42, 1)` | `rgba(255, 255, 255, 0.04)` | `bg-ui-contrast-bg-subtle` |
| `--contrast-fg-primary` | `rgba(255, 255, 255, 0.88)` | `rgba(255, 255, 255, 0.88)` | `text-ui-contrast-fg-primary` |
| `--contrast-fg-secondary` | `rgba(255, 255, 255, 0.56)` | `rgba(255, 255, 255, 0.56)` | `text-ui-contrast-fg-secondary` |
| `--contrast-border-base` | `rgba(255, 255, 255, 0.15)` | `rgba(255, 255, 255, 0.16)` | `border-ui-contrast-border-base` |
| `--contrast-border-top` | `rgba(24, 24, 27, 1)` | `rgba(33, 33, 36, 1)` | `border-ui-contrast-border-top` |
| `--contrast-border-bot` | `rgba(255, 255, 255, 0.1)` | `rgba(255, 255, 255, 0.08)` | `border-ui-contrast-border-bot` |

### Alpha / Opacity (`--alpha-*`)

| CSS variable | Value | Tailwind class |
|---|---|---|
| `--alpha-250` | `rgba(24, 24, 27, 0.1)` light / `rgba(255, 255, 255, 0.1)` dark | `text-ui-alpha-250`, `bg-ui-alpha-250` |
| `--alpha-400` | `rgba(24, 24, 27, 0.24)` light / `rgba(255, 255, 255, 0.24)` dark | `text-ui-alpha-400`, `bg-ui-alpha-400` |

---

## Shadow / Box-Shadow Tokens

The preset extends `theme.extend.boxShadow` with named shadow tokens. These are used via standard Tailwind `shadow-*` classes:

| Token | Usage |
|---|---|
| `borders-base` | Default border shadow (used by `Input`, `Radio`, etc.) |
| `borders-strong-with-shadow` | Stronger border + shadow |
| `borders-interactive` | Interactive element shadow |
| `borders-interactive-with-focus` | Interactive element with focus ring |
| `borders-interactive-with-shadow` | Interactive element with shadow |
| `borders-interactive-with-active` | Interactive element with active ring |
| `borders-error` | Error state border |
| `borders-focus` | Focus ring |
| `elevation-card-rest` | Card default elevation |
| `elevation-card-hover` | Card hover elevation |
| `elevation-flyout` | Flyout/dropdown elevation |
| `elevation-tooltip` | Tooltip elevation |
| `elevation-modal` | Modal elevation |
| `elevation-code-block` | Code block elevation |
| `elevation-commandbar` | Command bar elevation |
| `buttons-neutral` | Neutral button shadow |
| `buttons-neutral-focus` | Neutral button focus ring |
| `buttons-danger` | Danger button shadow |
| `buttons-danger-focus` | Danger button focus ring |
| `buttons-inverted` | Inverted/primary button shadow |
| `buttons-inverted-focus` | Inverted/primary button focus ring |
| `buttons-transparent` | Transparent button shadow |
| `buttons-transparent-hover` | Transparent button hover shadow |
| `buttons-transparent-pressed` | Transparent button pressed shadow |
| `details-contrast-on-bg-interactive` | Detail contrast on interactive bg |
| `details-switch-handle` | Switch handle shadow |
| `details-switch-background` | Switch track shadow |
| `details-switch-background-focus` | Switch track focus shadow |

---

## Typography: Two Systems

There are **two** typography systems in this storefront. They are **not** interchangeable.

### 1. Preset `txt-*` classes (from `@medusajs/ui-preset`)

These are registered globally by the preset via `addComponents(typography)`. They use the Inter font family and are the **preferred** classes for Medusa UI consistency.

| Class | Font size | Line height | Weight |
|---|---|---|---|
| `txt-xsmall` | 12px | 19.2px | 400 |
| `txt-xsmall-plus` | 12px | 19.2px | 500 |
| `txt-small` | 13px | 20.8px | 400 |
| `txt-small-plus` | 13px | 20.8px | 500 |
| `txt-medium` | 14px | 22.4px | 400 |
| `txt-medium-plus` | 14px | 22.4px | 500 |
| `txt-large` | 16px | 25.6px | 400 |
| `txt-large-plus` | 16px | 25.6px | 500 |
| `txt-compact-xsmall` | 12px | 20px | 400 |
| `txt-compact-xsmall-plus` | 12px | 20px | 500 |
| `txt-compact-small` | 13px | 20px | 400 |
| `txt-compact-small-plus` | 13px | 20px | 500 |
| `txt-compact-medium` | 14px | 20px | 400 |
| `txt-compact-medium-plus` | 14px | 20px | 500 |
| `txt-compact-large` | 16px | 20px | 400 |
| `txt-compact-large-plus` | 16px | 20px | 500 |
| `txt-compact-xlarge` | 18px | 20px | 400 |
| `txt-compact-xlarge-plus` | 18px | 20px | 500 |
| `txt-xlarge` | 18px | 28.8px | 400 |
| `txt-xlarge-plus` | 18px | 28.8px | 500 |

Plus heading classes: `.h1-webs` (4rem/500), `.h2-webs` (3.5rem/500), `.h3-webs` (2.5rem/500), `.h4-webs` (1.5rem/500), `.h1-core` (1.125rem/500), `.h2-core` (1rem/500), `.h3-core` (0.875rem/500), `.h1-docs` (1.5rem/500), `.h2-docs` (1.125rem/500), `.h3-docs` (1rem/500), `.h4-docs` (0.875rem/500).

And code classes: `.code-label` (0.75rem/400), `.code-label-plus` (0.75rem/500), `.code-paragraph` (0.75rem/400), `.code-paragraph-plus` (0.75rem/500) — all using `Roboto Mono`.

**Where used**: `pagination`, `filter-radio-group`, `cart-totals`, `checkout layout`, `common/input`, `common/checkbox`, `common/ui/Text` component, etc.

### 2. Local `text-*-regular` / `text-*-semi` classes (from `globals.css`)

These are defined in `@layer components` in `src/styles/globals.css`. They use Tailwind's `@apply` and are mapped to arbitrary pixel values:

| Class | Font size | Line height | Weight | Tailwind equivalent |
|---|---|---|---|---|
| `text-xsmall-regular` | 10px | 16 | normal | `text-[10px] leading-4 font-normal` |
| `text-small-regular` | 12px | 20 | normal | `text-xs leading-5 font-normal` |
| `text-small-semi` | 12px | 20 | semibold | `text-xs leading-5 font-semibold` |
| `text-base-regular` | 14px | 24 | normal | `text-sm leading-6 font-normal` |
| `text-base-semi` | 14px | 24 | semibold | `text-sm leading-6 font-semibold` |
| `text-large-regular` | 16px | 24 | normal | `text-base leading-6 font-normal` |
| `text-large-semi` | 16px | 24 | semibold | `text-base leading-6 font-semibold` |
| `text-xl-regular` | 24px | 36 | normal | `text-2xl leading-[36px] font-normal` |
| `text-xl-semi` | 24px | 36 | semibold | `text-2xl leading-[36px] font-semibold` |
| `text-2xl-regular` | 30px | 48 | normal | `text-[30px] leading-[48px] font-normal` |
| `text-2xl-semi` | 30px | 48 | semibold | `text-[30px] leading-[48px] font-semibold` |
| `text-3xl-regular` | 32px | 44 | normal | `text-[32px] leading-[44px] font-normal` |
| `text-3xl-semi` | 32px | 44 | semibold | `text-[32px] leading-[44px] font-semibold` |

**Where used**: Page headings, not-found pages, account loading, cart not-found, etc.

### When to use which

| Scenario | Use |
|---|---|
| Inside `@medusajs/ui` components (`Text`, `Heading`) | Preset `txt-*` classes (they're the default) |
| Custom headings / page titles | Local `text-*-semi` classes |
| Form labels, helper text | Preset `txt-compact-*` classes |
| Legacy page headings | Local `text-*-semi` classes (already in use) |

**Rule**: Do **not** mix `txt-medium` with `text-base-regular` on the same element. They have different font sizes (14px vs 14px but different line heights: 22.4px vs 24px) and different font-weight defaults (400 vs normal, which is equivalent but the line-height difference matters).

---

## Global Stylesheet

**File**: `apps/storefront/src/styles/globals.css`  
**Imported by**: `apps/storefront/src/app/layout.tsx` (`import "styles/globals.css"`)

```css
@import "tailwindcss/base";
@import "tailwindcss/components";
@import "tailwindcss/utilities";

@layer utilities {
  /* Chrome, Safari and Opera */
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }

  .no-scrollbar::-webkit-scrollbar-track {
    background-color: transparent;
  }

  .no-scrollbar {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }

  input:focus ~ label,
  input:not(:placeholder-shown) ~ label {
    @apply -translate-y-2 text-xsmall-regular;
  }

  input:focus ~ label {
    @apply left-0;
  }

  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus,
  textarea:-webkit-autofill,
  textarea:-webkit-autofill:hover,
  textarea:-webkit-autofill:focus,
  select:-webkit-autofill,
  select:-webkit-autofill:hover,
  select:-webkit-autofill:focus {
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
}

@layer components {
  .content-container {
    @apply max-w-[1440px] w-full mx-auto px-6;
  }

  .contrast-btn {
    @apply px-4 py-2 border border-black rounded-full hover:bg-black hover:text-white transition-colors duration-200 ease-in;
  }

  .text-xsmall-regular {
    @apply text-[10px] leading-4 font-normal;
  }

  .text-small-regular {
    @apply text-xs leading-5 font-normal;
  }

  .text-small-semi {
    @apply text-xs leading-5 font-semibold;
  }

  .text-base-regular {
    @apply text-sm leading-6 font-normal;
  }

  .text-base-semi {
    @apply text-sm leading-6 font-semibold;
  }

  .text-large-regular {
    @apply text-base leading-6 font-normal;
  }

  .text-large-semi {
    @apply text-base leading-6 font-semibold;
  }

  .text-xl-regular {
    @apply text-2xl leading-[36px] font-normal;
  }

  .text-xl-semi {
    @apply text-2xl leading-[36px] font-semibold;
  }

  .text-2xl-regular {
    @apply text-[30px] leading-[48px] font-normal;
  }

  .text-2xl-semi {
    @apply text-[30px] leading-[48px] font-semibold;
  }

  .text-3xl-regular {
    @apply text-[32px] leading-[44px] font-normal;
  }

  .text-3xl-semi {
    @apply text-[32px] leading-[44px] font-semibold;
  }
}
```

---

## Tailwind Configuration

**File**: `apps/storefront/tailwind.config.js`

```js
const path = require("path")

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
      colors: {
        grey: {
          0: "#FFFFFF",
          5: "#F9FAFB",
          10: "#F3F4F6",
          20: "#E5E7EB",
          30: "#D1D5DB",
          40: "#9CA3AF",
          50: "#6B7280",
          60: "#4B5563",
          70: "#374151",
          80: "#1F2937",
          90: "#111827",
        },
      },
      borderRadius: {
        none: "0px",
        soft: "2px",
        base: "4px",
        rounded: "8px",
        large: "16px",
        circle: "9999px",
      },
      maxWidth: {
        "8xl": "100rem",
      },
      screens: {
        "2xsmall": "320px",
        xsmall: "512px",
        small: "1024px",
        medium: "1280px",
        large: "1440px",
        xlarge: "1680px",
        "2xlarge": "1920px",
      },
      fontSize: {
        "3xl": "2rem",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Ubuntu",
          "sans-serif",
        ],
      },
      keyframes: {
        ring: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "fade-in-right": {
          "0%": {
            opacity: "0",
            transform: "translateX(10px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateX(0)",
          },
        },
        "fade-in-top": {
          "0%": {
            opacity: "0",
            transform: "translateY(-10px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "fade-out-top": {
          "0%": {
            height: "100%",
          },
          "99%": {
            height: "0",
          },
          "100%": {
            visibility: "hidden",
          },
        },
        "accordion-slide-up": {
          "0%": {
            height: "var(--radix-accordion-content-height)",
            opacity: "1",
          },
          "100%": {
            height: "0",
            opacity: "0",
          },
        },
        "accordion-slide-down": {
          "0%": {
            "min-height": "0",
            "max-height": "0",
            opacity: "0",
          },
          "100%": {
            "min-height": "var(--radix-accordion-content-height)",
            "max-height": "none",
            opacity: "1",
          },
        },
        enter: {
          "0%": { transform: "scale(0.9)", opacity: 0 },
          "100%": { transform: "scale(1)", opacity: 1 },
        },
        leave: {
          "0%": { transform: "scale(1)", opacity: 1 },
          "100%": { transform: "scale(0.9)", opacity: 0 },
        },
        "slide-in": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(0)" },
        },
      },
      animation: {
        ring: "ring 2.2s cubic-bezier(0.5, 0, 0.5, 1) infinite",
        "fade-in-right":
          "fade-in-right 0.3s cubic-bezier(0.5, 0, 0.5, 1) forwards",
        "fade-in-top": "fade-in-top 0.2s cubic-bezier(0.5, 0, 0.5, 1) forwards",
        "fade-out-top":
          "fade-out-top 0.2s cubic-bezier(0.5, 0, 0.5, 1) forwards",
        "accordion-open":
          "accordion-slide-down 300ms cubic-bezier(0.87, 0, 0.13, 1) forwards",
        "accordion-close":
          "accordion-slide-up 300ms cubic-bezier(0.87, 0, 0.13, 1) forwards",
        enter: "enter 200ms ease-out",
        "slide-in": "slide-in 1.2s cubic-bezier(.41,.73,.51,1.02)",
        leave: "leave 150ms ease-in forwards",
      },
    },
  },
  plugins: [require("tailwindcss-radix")()],
}
```

---

## Where to Edit What (Quick Reference for AI)

| Want to change... | Edit this file |
|---|---|
| Global layout width / padding | `src/styles/globals.css` → `.content-container` |
| Local typography scale | `src/styles/globals.css` → `@layer components` → `.text-*-regular` / `.text-*-semi` |
| Floating label behavior | `src/styles/globals.css` → `input:focus ~ label` |
| Autofill border/color | `src/styles/globals.css` → `input:-webkit-autofill` |
| Search input decoration | `src/styles/globals.css` → `input[type="search"]` |
| Custom button style | `src/styles/globals.css` → `.contrast-btn` |
| Hide scrollbar | `src/styles/globals.css` → `.no-scrollbar` |
| Custom color (grey scale) | `tailwind.config.js` → `theme.extend.colors` |
| Border radius values | `tailwind.config.js` → `theme.extend.borderRadius` |
| Responsive breakpoints | `tailwind.config.js` → `theme.extend.screens` |
| Font family | `tailwind.config.js` → `theme.extend.fontFamily.sans` |
| Animations (keyframes + names) | `tailwind.config.js` → `theme.extend.keyframes` + `theme.extend.animation` |
| Transition properties | `tailwind.config.js` → `theme.extend.transitionProperty` |
| Dark mode | `tailwind.config.js` → `darkMode: "class"` (toggle `.dark` on `<html>`) |
| Medusa design tokens | `@medusajs/ui-preset` (do NOT edit — override in `tailwind.config.js` if needed) |

---

## Layout Utilities

| Class | CSS | Usage |
|---|---|---|
| `.content-container` | `max-w-[1440px] w-full mx-auto px-6` | Main page wrapper — every page uses this. Commonly combined with `py-6` for vertical padding on listing pages. |
| `.contrast-btn` | `px-4 py-2 border border-black rounded-full hover:bg-black hover:text-white transition-colors duration-200 ease-in` | High-contrast button (used sparingly in account/header contexts) |

---

## Custom Color Palette (Local Only)

Only one custom color is defined locally — `grey`. All Medusa tokens (`text-ui-fg-*`, `bg-ui-bg-*`, etc.) come from `@medusajs/ui-preset`.

| Token | Value | Usage |
|---|---|---|
| `grey.0` | `#FFFFFF` | White |
| `grey.5` | `#F9FAFB` | Lightest grey background |
| `grey.10` | `#F3F4F6` | Light grey background |
| `grey.20` | `#E5E7EB` | Border subtle |
| `grey.30` | `#D1D5DB` | Border base |
| `grey.40` | `#9CA3AF` | Muted text |
| `grey.50` | `#6B7280` | Subtle text |
| `grey.60` | `#4B5563` | Secondary text |
| `grey.70` | `#374151` | Body text |
| `grey.80` | `#1F2937` | Heading text |
| `grey.90` | `#111827` | Darkest text |

**Note**: The local `grey` scale is **not** the same as Medusa's `bg-ui-bg-*` tokens. The preset's `--bg-base` is `#FFFFFF` in light mode and `#212121` in dark mode. Use Medusa tokens for consistent theming; use `grey.*` only for one-off grays that don't need dark mode switching.

---

## Border Radius Scale

| Token | Value | Usage |
|---|---|---|
| `none` | `0px` | Sharp corners |
| `soft` | `2px` | Subtle rounding |
| `base` | `4px` | Default |
| `rounded` | `8px` | Cards, buttons |
| `large` | `16px` | Modals, containers |
| `circle` | `9999px` | Pills, avatars |

---

## Responsive Breakpoints

| Alias | Min width | Common usage |
|---|---|---|
| `2xsmall` | 320px | Very small phones |
| `xsmall` | 512px | Large phones |
| `small` | 1024px | Tablet / small desktop (sidebar nav, 2-col layout) |
| `medium` | 1280px | Desktop (3-col product grid) |
| `large` | 1440px | Large desktop |
| `xlarge` | 1680px | Extra large |
| `2xlarge` | 1920px | Full HD |

**Note**: `small:1024px` is the most commonly used breakpoint. It controls the sidebar nav, 2→3→4 column grids, and sticky layouts.

---

## Animations

### Preset animations (from `tailwindcss-animate`)

The preset includes `tailwindcss-animate`, which provides:

| Class | Animation | Duration | Easing |
|---|---|---|---|
| `animate-in` | fade-in + slide-in from top | 200ms | ease-out |
| `animate-out` | fade-out + slide-out to top | 150ms | ease-in |
| `animate-pulse` | pulse | 2s | cubic-bezier(0.4, 0, 0.6, 1) |

Plus `slideInFromTop`, `slideInFromBottom`, `slideInFromLeft`, `slideInFromRight`, `fadeIn`, `fadeOut`, `zoomIn`, `zoomOut`, etc.

### Local custom animations

| Name | Duration | Easing | Usage |
|---|---|---|---|
| `ring` | 2.2s | `cubic-bezier(0.5, 0, 0.5, 1)` infinite | Loading spinner |
| `fade-in-right` | 0.3s | `cubic-bezier(0.5, 0, 0.5, 1)` forwards | Slide-in from right |
| `fade-in-top` | 0.2s | `cubic-bezier(0.5, 0, 0.5, 1)` forwards | Fade in from top |
| `fade-out-top` | 0.2s | `cubic-bezier(0.5, 0, 0.5, 1)` forwards | Collapse height then hide |
| `accordion-open` | 300ms | `cubic-bezier(0.87, 0, 0.13, 1)` forwards | Disclosure expand (uses `accordion-slide-down` keyframe) |
| `accordion-close` | 300ms | `cubic-bezier(0.87, 0, 0.13, 1)` forwards | Disclosure collapse (uses `accordion-slide-up` keyframe) |
| `enter` | 200ms | ease-out | Modal/dialog enter |
| `leave` | 150ms | ease-in forwards | Modal/dialog leave |
| `slide-in` | 1.2s | `cubic-bezier(.41,.73,.51,1.02)` | Notification slide |

### Preset accordion animations

The preset also provides:

| Name | Keyframe | Duration | Easing |
|---|---|---|---|
| `accordion-down` | `accordion-down` | 200ms | ease-out |
| `accordion-up` | `accordion-up` | 200ms | ease-out |

These are separate from the local `accordion-open`/`accordion-close` animations. The preset's versions use `height: 0px` → `height: var(--radix-accordion-content-height)`, while the local versions use `min-height`/`max-height` for a smoother slide.

**Underlying keyframes**: `accordion-slide-up` and `accordion-slide-down` are the raw keyframes; `accordion-open`/`accordion-close` are the named animations that reference them.

---

## Font

**Stack**: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `Helvetica Neue`, `Ubuntu`, `sans-serif`

- Defined in `tailwind.config.js` → `theme.extend.fontFamily.sans`.
- The preset's own font stack is `Inter`, `ui-sans-serif`, `system-ui`, ... plus emoji fallbacks. The storefront overrides this with the local `fontFamily.sans` in `tailwind.config.js`.
- No `@font-face` declarations — Inter is loaded from the system or Google Fonts CDN if available.
- No font-weight utilities beyond what the typography classes provide (normal + semibold for local, regular/medium/semibold for preset).
- Mono font: `Roboto Mono`, `ui-monospace`, `SFMono-Regular`, `Menlo`, `Monaco`, `Consolas`, `Liberation Mono`, `Courier New`, `monospace` (from preset).

---

## `@tailwindcss-radix` Plugin

**File**: `apps/storefront/tailwind.config.js` → `plugins`

```js
plugins: [require("tailwindcss-radix")()],
```

The `tailwindcss-radix` plugin adds variant utilities for styling Radix UI primitives based on their internal state. Used for:

- Accordion item open/closed states (`group-data-[state=open]:`, `group-data-[state=closed]:`)
- Radio group checked/unchecked states (`group-data-[state=checked]:`)
- Other Radix component state variants (`data-[state=open]`, `data-[state=closed]`, etc.)

This is why you see selectors like `group-data-[state=checked]:bg-ui-bg-interactive` in the codebase — these are Radix state variants provided by the plugin.

---

## `tailwindcss-animate` Plugin

Included via the preset's `preset.ts`:
```js
plugins: [plugin, require("tailwindcss-animate")]
```

Provides the `animate-in`, `animate-out`, and related animation utility classes. Not heavily used in the current storefront codebase, but available if needed.

---

## Root Layout

**File**: `apps/storefront/src/app/layout.tsx`

```tsx
<html lang="en" data-mode="light">
  <body>
    <main className="relative">{props.children}</main>
  </body>
</html>
```

- `data-mode="light"` is hardcoded — no dark mode toggle.
- `globals.css` is imported here, making it available to the entire app.
- `metadataBase` is set via `getBaseURL()` for OpenGraph and SEO.

---

## Checkout Layout

**File**: `apps/storefront/src/app/[countryCode]/(checkout)/layout.tsx`

- White background (`bg-white`).
- Top nav bar (`h-16 border-b`) with back-to-cart link and store name.
- Children render in a `<div data-testid="checkout-container">`.
- Footer shows `MedusaCTA` component.
- Intentionally minimal — no global Nav, no `CartDropdown`, no `CartMismatchBanner`.

---

## PostCSS Configuration

**File**: `apps/storefront/postcss.config.js`

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

Standard PostCSS setup. No custom plugins beyond Tailwind and Autoprefixer.

---

## How to Add New Global Styles

1. **New utility class** → add to `@layer utilities` in `src/styles/globals.css`
2. **New component class** → add to `@layer components` in `src/styles/globals.css`
3. **New design token** → add to `theme.extend` in `tailwind.config.js` (colors, spacing, etc.)
4. **New animation** → add both `keyframes` and `animation` entries in `tailwind.config.js`
5. **New breakpoint** → add to `theme.extend.screens` in `tailwind.config.js`

**Rule**: Do NOT add inline `<style>` tags or CSS-in-JS. All global styles go in `globals.css` or `tailwind.config.js`.

---

## Common Style Edits (AI Quick Reference)

| Goal | Where to edit | Example |
|---|---|---|
| Change page max width | `globals.css` → `.content-container` | `max-w-[1440px]` → `max-w-[1280px]` |
| Change body font | `tailwind.config.js` → `fontFamily.sans` | Replace `"Inter"` with `"Geist"` |
| Add new text size | `globals.css` → `@layer components` | Add `.text-4xl-regular` |
| Change button hover | `globals.css` → `.contrast-btn` | Change `hover:bg-black` to `hover:bg-blue-600` |
| Disable dark mode | `tailwind.config.js` → remove `darkMode` | Or set `darkMode: "false"` |
| Add animation | `tailwind.config.js` → `keyframes` + `animation` | Add `shake` keyframe + `animation.shake` |
| Change breakpoint | `tailwind.config.js` → `screens` | Change `small: "1024px"` to `"900px"` |
| Add custom color | `tailwind.config.js` → `colors` | Add `brand: { 500: "#FF0000" }` |
| Change border radius | `tailwind.config.js` → `borderRadius` | Change `rounded: "8px"` to `"12px"` |
| Hide scrollbar on element | Add `no-scrollbar` class | Already defined in `globals.css` |
| Override preset token | `tailwind.config.js` → `theme.extend.colors.ui` | Override `ui.bg.base.DEFAULT` |
| Use Medusa shadow | Add `shadow-elevation-card-rest` class | From preset `boxShadow` tokens |
| Use Medusa tag color | Add `bg-ui-tag-green-bg text-ui-tag-green-text` | From preset color tokens |

---

## Important Notes

- **Do NOT modify `@medusajs/ui-preset`** — it is a shared, auto-generated package. Override tokens in `tailwind.config.js` instead.
- **Do not add new CSS files** — all global styles live in `src/styles/globals.css`. Component-scoped styles use Tailwind utility classes.
- **Do not use `@apply` in component files** — it only works in `globals.css` where `@layer` is defined.
- **The preset is version-locked to `@medusajs/medusa`** — when upgrading Medusa, also upgrade `@medusajs/ui-preset` and `@medusajs/ui` to matching versions.
- **`tailwindcss-animate` is transitively included** via the preset — no separate install needed.
- **Dark mode is disabled in the UI** — `darkMode: "class"` is configured, but there is no toggle in the storefront. The `<html data-mode="light">` is hardcoded.
- **The `content` array does not include `node_modules/@medusajs/ui`** — this is acceptable because the preset registers its typography classes globally. Add it only if you import custom `@medusajs/ui` components.
