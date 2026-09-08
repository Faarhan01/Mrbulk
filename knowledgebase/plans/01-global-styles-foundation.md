# Plan 01 — Global Styles Foundation

## Objective

Before copying any components from the reference frontend, establish a global style foundation that:
1. Preserves MedusaJS architecture and design-token authority
2. Adds only the missing tokens/utilities that the reference patterns actually need
3. Keeps all changes inside `globals.css` and `tailwind.config.js` — no inline styles, no new CSS files

This plan is storefront-only. Backend remains untouched.

---

## Current State Analysis

### MedusaJS Style Layers (authoritative order)

1. **`@medusajs/ui-preset`** — CSS custom properties + Tailwind theme extensions. This is the source of truth for colors, shadows, borders, and typography tokens.
2. **`globals.css`** — Local `@layer utilities` and `@layer components` for one-off helpers (`.no-scrollbar`, `.content-container`, floating-label behavior, local typography scale).
3. **`tailwind.config.js`** — Local extensions: `grey` color scale, `borderRadius`, responsive `screens`, custom `keyframes`/`animation`, `transitionProperty`, `tailwindcss-radix` plugin.

### What the Reference Frontend Uses

The reference has its own theme system:
- Runtime `getThemeClasses(themeColor)` returning class strings for `blue`, `indigo`, `emerald`, `rose`, `amber`, `slate`
- Gradient backgrounds (`bg-gradient-to-br from-.../90 via-.../75 to-.../85`)
- Ambient glow decorations (absolute-positioned blurred circles)
- Dark mode via `dark:` variants on every token
- Local typography: `text-2xl sm:text-4xl font-black tracking-tight`, `text-xs sm:text-sm font-medium`, etc.
- Spacing conventions: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`, `py-8 sm:py-12`, `space-y-4 sm:space-y-6`
- Border radius: `rounded-2xl sm:rounded-3xl`
- Shadow: `shadow-sm`, `shadow-md`, `shadow-xs`

### Gap Analysis

| Need | MedusaJS Current State | Gap |
|---|---|---|
| Theme color accents (blue/indigo/emerald/rose/amber/slate) | Only `@medusajs/ui-preset` interactive tokens (`text-ui-fg-interactive`, `bg-ui-bg-interactive`) | No per-page theme accent system |
| Gradient background utilities | None locally; preset doesn't define gradients | Need to add via `globals.css` or Tailwind config |
| Ambient glow decorations | None | Can be added as utility classes in `globals.css` |
| Consistent max-width container | `.content-container` = `max-w-[1440px]` | Reference uses `max-w-7xl` (1280px). Keep Medusa default, document the difference. |
| Border radius scale | `rounded: 8px`, `large: 16px` | Reference uses `rounded-2xl` (16px) and `rounded-3xl` (24px). Need `3xl` radius. |
| Typography scale | Preset `txt-*` + local `text-*-regular/semi` | Reference uses arbitrary sizes (`text-2xl`, `text-4xl`, `font-black`, `tracking-tight`). These can use arbitrary Tailwind values directly. |
| Dark mode | `darkMode: "class"` configured but no toggle UI | Reference uses `dark:` variants extensively. Medusa can support them; no toggle needed for now. |
| Spacing conventions | Standard Tailwind spacing | Reference uses `space-y-4`, `gap-3.5`, `px-4 sm:px-6 lg:px-8`. These are already available. |

---

## Strategic Approach

**Do NOT blindly copy the reference's theme system.** Instead:

1. **Extend the preset minimally** — Add only the tokens that are missing and truly needed by shared components.
2. **Use CSS custom properties for theme colors** — Define `--theme-{color}` variables in `:root` and `.dark` so theme accents can be swapped without duplicating utility classes.
3. **Add gradient utilities in `globals.css`** — Use `@layer utilities` to define reusable gradient classes that reference the theme variables.
4. **Keep component-level styling in components** — Do not move component-specific gradients or decorations into global CSS. Only extract patterns used by 2+ shared components.
5. **Respect Medusa's existing patterns** — Use `@medusajs/ui-preset` tokens for foreground/background/border. Use local `grey.*` only for one-off grays.

---

## Step 1 — Extend Tailwind Config with Missing Tokens

### 1.1 Add `3xl` border radius

**File**: `apps/storefront/tailwind.config.js`

```js
borderRadius: {
  none: "0px",
  soft: "2px",
  base: "4px",
  rounded: "8px",
  large: "16px",
  "3xl": "24px",    // NEW — for rounded-3xl
  circle: "9999px",
},
```

**Why**: The reference uses `rounded-3xl` extensively for hero banners and cards. Medusa's current scale stops at `large: 16px`. Adding `3xl: 24px` fills this gap without overriding the preset.

### 1.2 Add theme color CSS variables

**File**: `apps/storefront/tailwind.config.js` → `theme.extend.colors`

```js
colors: {
  // ... existing grey scale
  theme: {
    blue: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
    indigo: { /* same structure */ },
    emerald: { /* same structure */ },
    rose: { /* same structure */ },
    amber: { /* same structure */ },
    slate: { /* same structure */ },
  },
},
```

**Why**: This gives us `bg-theme-blue-500`, `text-theme-rose-600`, etc. These are **additive** — they don't override preset tokens. They provide a consistent, accessible color scale for theme accents.

**Alternative considered**: Mapping directly to `@medusajs/ui-preset` interactive tokens. Rejected because the preset only provides one interactive color (blue), and we need six theme variants.

### 1.3 Add gradient utilities

**File**: `apps/storefront/tailwind.config.js` → `theme.extend.backgroundImage`

```js
backgroundImage: {
  'gradient-hero-blue': 'linear-gradient(135deg, var(--gradient-from) 0%, var(--gradient-via) 50%, var(--gradient-to) 100%)',
  // ... other theme variants
},
```

**Why**: The reference uses `bg-gradient-to-br from-.../90 via-.../75 to-.../85` with opacity modifiers. Medusa's preset doesn't define gradient utilities. Adding them as CSS custom property references keeps them themeable.

**Implementation note**: The actual CSS variables (`--gradient-from`, etc.) will be set in `globals.css` per theme.

---

## Step 2 — Extend `globals.css` with Shared Utilities

### 2.1 Theme gradient classes

**File**: `apps/storefront/src/styles/globals.css` → `@layer utilities`

```css
@layer utilities {
  /* Theme gradient backgrounds — used by PageBanner and similar heroes */
  .bg-gradient-theme-blue {
    @apply bg-gradient-to-br from-theme-blue-200/90 via-theme-blue-100/75 to-theme-blue-50/85;
    /* dark variants handled via .dark */
  }
  .dark .bg-gradient-theme-blue {
    @apply from-theme-blue-950/90 via-theme-blue-900/60 to-theme-blue-950/80;
  }

  /* Ambient glow — used for decorative blurred circles */
  .glow-theme-blue {
    @apply bg-theme-blue-400/20 dark:bg-theme-blue-500/25;
  }
  .glow-theme-indigo { /* same pattern */ }
  .glow-theme-emerald { /* same pattern */ }
  .glow-theme-rose { /* same pattern */ }
  .glow-theme-amber { /* same pattern */ }
  .glow-theme-slate { /* same pattern */ }

  /* Content container — keep existing, document the reference uses max-w-7xl */
}
```

**Why**: These are used by 2+ shared components (`PageBanner`, `CategoryBarCarousel`). They belong in global CSS, not in component className strings.

### 2.2 Preserve existing utilities

Do NOT modify:
- `.no-scrollbar`
- `.content-container`
- Floating-label input CSS
- Autofill styles
- Existing `text-*-regular` / `text-*-semi` scale

---

## Step 3 — Add Theme Token Helper (JS, not CSS)

### 3.1 Create `src/lib/theme-utils.ts`

```ts
export type ThemeColor = 'blue' | 'indigo' | 'emerald' | 'rose' | 'amber' | 'slate'

export interface ThemeClasses {
  bg: string
  text: string
  border: string
  lightBg: string
  badge: string
  accent: string
  primaryHex: string
  shadow: string
  ring: string
}

export const getThemeClasses = (themeColor: ThemeColor): ThemeClasses => {
  // Map themeColor to Tailwind class strings using the new theme tokens
  // ...
}
```

**Why**: The reference uses a runtime `getThemeClasses` function. In MedusaJS, we implement this as a pure utility that returns class strings based on the new `theme.*` color scale. This keeps components clean and avoids duplicating theme logic.

**Where to use it**: Shared components (`PageBanner`, `CategoryBarCarousel`, `RecentlyViewedSection`) import this helper. Feature pages pass `themeColor` prop from their own context.

---

## Step 4 — Typography Strategy

### 4.1 Do NOT add new typography classes to `globals.css`

The reference uses arbitrary values like `text-2xl`, `text-4xl`, `font-black`, `tracking-tight`. These are already valid Tailwind utilities. Use them directly in components.

### 4.2 Document the two-system contract

Update `site-structure/global-styles.md` to clarify:
- Preset `txt-*` classes are for **Medusa UI primitives** (`Text`, `Heading` from local UI kit)
- Local `text-*-regular/semi` are for **page-level headings** (already in use)
- **Shared components should use arbitrary Tailwind values** (`text-2xl`, `font-black`, `tracking-tight`) for design-system-agnostic styling, OR use the local `text-*-semi` classes for consistency with existing pages.

### 4.3 Do NOT add `font-black` to the global scale

`font-black` (900) is already a standard Tailwind utility. Use it directly.

---

## Step 5 — Dark Mode Strategy

### 5.1 Keep existing `darkMode: "class"` config

The reference uses `dark:` variants extensively. Medusa already supports this. No change needed.

### 5.2 Do NOT add a dark mode toggle

The reference has no toggle (it's hardcoded). Medusa's root layout has `data-mode="light"` hardcoded. Leave as-is.

### 5.3 Ensure all new shared components support dark mode

Every new shared component must include `dark:` variants for:
- Background colors
- Text colors
- Border colors
- Shadow/glow effects

Use the preset's `text-ui-fg-*`, `bg-ui-bg-*`, `border-ui-border-*` tokens where possible. For theme accents, use `dark:` variants of the new `theme.*` color scale.

---

## Step 6 — Spacing and Layout

### 6.1 Keep `.content-container` as-is

The reference uses `max-w-7xl` (1280px). Medusa uses `max-w-[1440px]`. Keep Medusa's default — it's wider and more appropriate for a modern storefront.

### 6.2 Standardize padding pattern

The reference uses `px-4 sm:px-6 lg:px-8` consistently. This is already valid Tailwind. Document it as the standard padding pattern for new pages.

### 6.3 Do NOT add new spacing tokens

Standard Tailwind spacing (`px-4`, `py-8`, `gap-4`, `space-y-6`) is sufficient. No custom spacing scale needed.

---

## Step 7 — Animation and Motion

### 7.1 Keep existing preset animations

`tailwindcss-animate` is already included via the preset. `animate-in`, `animate-out`, etc. are available.

### 7.2 Keep existing local animations

`fade-in-right`, `fade-in-top`, `accordion-open/close`, etc. are already defined in `tailwind.config.js`.

### 7.3 Do NOT add motion libraries yet

The reference uses `motion/react` (Framer Motion). This is **not** currently in the Medusa storefront's dependencies. Adding it is out of scope for the global-styles phase. If needed later, add it as a dependency and create a separate plan.

---

## Verification

After implementing this plan:

1. **TypeScript**: `cd apps/storefront && pnpm exec tsc --noEmit` — 0 errors
2. **Lint**: `cd apps/storefront && pnpm run lint` — no new errors
3. **Build**: `cd apps/storefront && pnpm run build` — succeeds
4. **Runtime**: `pnpm run dev` — storefront loads at `http://localhost:8000` with no visual regressions
5. **Dark mode**: Manually toggle `.dark` on `<html>` in DevTools — all new utilities render correctly in both modes

---

## Files Changed

| File | Change |
|---|---|
| `apps/storefront/tailwind.config.js` | Add `3xl` border radius, `theme.*` color scales, optional gradient utilities |
| `apps/storefront/src/styles/globals.css` | Add `@layer utilities` for theme gradients, glow effects |
| `apps/storefront/src/lib/theme-utils.ts` | **NEW** — `getThemeClasses()` helper |
| `knowledgebase/site-structure/global-styles.md` | Update to document new tokens and conventions |
| `knowledgebase/customizations/rules.md` | Add rules for theme token usage |
| `knowledgebase/customizations/instructions.md` | Add guidance on using shared theme utilities |

---

## Out of Scope for This Plan

- Component implementation (`PageBanner`, `CategoryBarCarousel`, `RecentlyViewedSection`) — separate plan
- `motion/react` / Framer Motion — separate plan, requires dependency decision
- Backend schema changes — never in scope for UI work

## Ignored Features

The following are intentionally **not** part of this plan and should not be added unless the user explicitly requests them:

- **New backend modules, schemas, or migrations** — global styles are a storefront-only concern.
- **New npm dependencies** — adding animation libraries or UI kits is out of scope for a styles foundation plan.
- **Admin dashboard customizations** — this plan only touches the storefront.
- **Third-party integrations** — analytics, payment, shipping, etc. require backend work.

**Rule:** If a design element from the reference requires any of the above, document it here as "ignored" and ask the user whether to proceed with backend work before implementing it.
- Admin dashboard customizations — separate plan if needed

---

## Dependencies and Decisions Required

1. **Confirm `theme.*` color scale values** — The reference uses specific hex values for each theme. Confirm these match the desired brand palette before implementing.
2. **Confirm `max-w-7xl` vs `max-w-[1440px]`** — Keep Medusa's wider container, or adopt the reference's narrower width? This plan recommends keeping Medusa's default.
3. **Confirm no `motion/react` dependency** — If animations are needed, add `framer-motion` to `package.json` in a separate step.
