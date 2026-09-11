# Frontend Improvements

This file tracks improvements, enhancements, and non-bug-fix changes made to the storefront. For bug fixes, see `frontend-fixes.md`.

## Improvement Log

### IMP-01 — Middleware resilience during backend startup

**Date:** 2026-09-11

**File:** `apps/storefront/src/middleware.ts`

**What changed:** Wrapped the backend region fetch in `getRegionMap()` with a `try-catch`. If the backend is still starting up and returns `fetch failed`, the middleware now logs the error and returns an empty region map instead of throwing.

**Why:** During `pnpm run dev`, the storefront can compile before the backend is fully ready. The old behavior threw an unhandled exception from middleware, which produced `⨯ Error [TypeError]: fetch failed` in the dev log and could break page rendering. The new behavior degrades gracefully: the site still loads, and regions populate on the next request once the backend is available.

**Impact:** Startup order is no longer a hard dependency. The site remains usable during backend restarts. Region data is cached for 1 hour, so transient backend unavailability won’t cause repeated failures.

**Rollback:** Remove the `try-catch` wrapper and restore the original fetch block if you want strict failure behavior again.

---

*Add new improvements above this line.*
