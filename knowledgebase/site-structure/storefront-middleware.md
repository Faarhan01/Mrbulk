# Storefront: Middleware

## Overview

`src/middleware.ts` runs on the **Edge runtime** and handles three responsibilities: region detection and URL prefixing, cache ID cookie management, and region map caching. This file documents the middleware internals, the region resolution chain, the cache strategy, and the matcher exclusions.

## Why Edge Runtime?

The middleware runs on Vercel Edge Functions (or compatible edge runtimes). This means:
- **Cannot use the Medusa JS SDK** — it requires Node.js built-ins (`Buffer`, `crypto`, etc.) that are not available on the edge.
- Must use raw `fetch()` for all HTTP calls.
- Has access to `request.cf` (Cloudflare Workers geo headers) and `request.headers`.

## Matcher

```ts
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|assets|png|svg|jpg|jpeg|gif|webp).*)",
  ],
}
```

Excluded paths:
- `api/*` — API routes (Next.js and storefront API routes)
- `_next/static/*` — Next.js static assets
- `_next/image/*` — Next.js image optimization
- `favicon.ico` — favicon
- `images/*`, `assets/*` — static asset directories
- `*.{png,svg,jpg,jpeg,gif,webp}` — image file extensions

Everything else (including all `/(main)/`, `/(checkout)/`, and `/order/` routes) passes through the middleware.

## Region Resolution Chain

The middleware resolves the region (country code) in this priority order:

1. **URL prefix** — the first path segment (e.g., `/dk/store`, `/de/account`).
2. **Cloudflare geo header** — `request.cf?.country` (ISO 3166-1 alpha-2).
3. **Vercel geo header** — `x-vercel-ip-country`.
4. **Fallback** — `NEXT_PUBLIC_DEFAULT_REGION` env var (default: `"dk"`).

### 307 Redirect

If the URL does not start with a valid country code, the middleware issues a **307 redirect** to `/{resolvedCountryCode}/{path}`. The 307 preserves the HTTP method and body, which is important for POST requests.

The resolved country code is validated against the region map (fetched from the backend). If the country is not in any region, the middleware falls back to `NEXT_PUBLIC_DEFAULT_REGION`.

## Region Map Cache

The middleware maintains a **1-hour in-memory cache** of regions:

```ts
let regionMapCache = {
  regionMap: Map<string, HttpTypes.StoreRegion>,
  regionMapUpdated: 0,
}
```

- `regionMapUpdated` is a timestamp. The cache is considered stale if `Date.now() - regionMapUpdated > 3600 * 1000`.
- On first request or when stale, the middleware fetches `{BACKEND_URL}/store/regions` with `x-publishable-api-key`.
- The response is indexed by country ISO code (`region.countries.map(c => c.iso_2)`).
- Cache is per-process — in a multi-instance deployment, each instance maintains its own cache.

### Cache Invalidation

There is no explicit invalidation. The cache simply expires after 1 hour and re-fetches. This is acceptable because region data changes infrequently.

## `_medusa_cache_id` Cookie

The middleware manages a `_medusa_cache_id` cookie that namespaces the Next.js fetch cache:

- **Set on first request**: When a request arrives with a country-prefixed URL and no `_medusa_cache_id` cookie, the middleware generates a new UUID and sets the cookie.
- **Expiry**: 24 hours (`maxAge: 60 * 60 * 24`).
- **Purpose**: Ensures that fetch cache tags (`carts-{id}`, `products-{id}`, etc.) are scoped per-user. Without this, one user's cart data could leak into another user's cached response.

## Region Fetch Call

```ts
fetch(`${BACKEND_URL}/store/regions`, {
  next: { revalidate: 3600, tags: [`regions-${cacheId}`] },
  headers: { "x-publishable-api-key": NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY },
  cache: "force-cache",
})
```

- `next: { revalidate: 3600 }` — Next.js caches the response for 1 hour.
- `next: { tags: [`regions-${cacheId}`] }` — cache tag is scoped by the user's `_medusa_cache_id`.
- `cache: "force-cache"` — always reads from cache if fresh; falls back to network on miss or stale.

## Edge Runtime Constraints

Because the middleware runs on the edge:
- **Limited `process.env` access** — only `NEXT_PUBLIC_*` env vars are available (injected at build time). The middleware reads `NEXT_PUBLIC_MEDUSA_BACKEND_URL`, `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_DEFAULT_REGION`.
- **No Node.js APIs** — no `Buffer`, `crypto`, `fs`, etc. Use Web APIs only. The one exception is `crypto.randomUUID()` which is available in the edge runtime.
- **No SDK** — cannot import `@medusajs/js-sdk`. Use raw `fetch` with the correct headers.

## Common Gotchas

- **The middleware runs on every request** (except excluded paths). Keep it fast — the region map fetch is the only network call, and it's cached.
- **307 redirects preserve the method** — a POST to `/checkout` without a country prefix will 307 to `/dk/checkout` with the POST body intact.
- **`_medusa_cache_id` is set lazily** — it is not set on the first request if the URL already has a country prefix and the cookie exists.
- **Region map is per-process** — in a serverless environment with warm instances, each instance may have a slightly stale region map for up to 1 hour.
