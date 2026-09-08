# Marketing & Google Ads Implementation Research

## 1. Goal
Implement marketing tracking and Google Ads conversion measurement for the MedusaJS store at `C:\Users\faarh\OneDrive\Documents\latest1\medusa-js`. The solution should be maintainable, privacy-compliant, and aligned with Medusa’s architecture.

---

## 2. Current State of Marketing in MedusaJS

### 2.1 No Native Google Ads Support
There is **no built-in Google Ads integration** in MedusaJS core, and **no dedicated Google Ads community plugin** exists. The marketing plugin ecosystem is limited to:

| Plugin/Tool | Purpose | Status |
|-------------|---------|--------|
| `@variablevic/google-analytics-medusa` | GA4 Measurement Protocol server-side tracking | Active, ~2025 |
| `medentem/klaviyo-medusa` | Klaviyo email marketing + customer sync | Active |
| `@tsc_tech/medusa-plugin-product-seo` | Product/category SEO metadata | Active |
| `erickirt/medusa-marketing` | Action-based email framework | v1 only, needs migration |
| `medusa-storefront-analytics` | GTM dataLayer adapter for storefronts | Active, 1.5.3 |

### 2.2 Medusa Analytics Module
Medusa v2.8.3+ includes an **Analytics Module** (`@medusajs/medusa/analytics`) with:
- Provider interface (`track()`, `identify()`)
- Built-in providers: `analytics-local`, `analytics-posthog`
- No automatic event wiring — you must call `track()` from workflows/subscribers
- **Server-side only** — no frontend tracking mechanism

### 2.3 Feature Request: GTM DataLayer
There is an active feature request in the Medusa repo for a `@medusajs/gtm-datalayer` package that would:
- Inject GTM snippet into storefront
- Map Medusa commerce events to GA4 dataLayer events
- Serve as a multiplexer for GA4, Meta Pixel, Google Ads, TikTok, etc.

**Status**: Not yet implemented — community opportunity.

---

## 3. Google Ads Tracking Options

### Option A: Server-Side Webhook/API (Recommended for Accuracy)
Send conversion events directly to Google Ads API from the Medusa backend.

**How it works**:
1. User clicks Google Ad → lands on site with `gclid` in URL
2. Store `gclid` in cookie/session
3. On order placed, backend subscriber fires
4. Backend calls Google Ads API (`conversionUploads.uploadClickConversions`)
5. Enhanced conversions: hash email/phone/address and attach

**Pros**:
- Most reliable — no ad blockers, no iOS restrictions
- Server has all order data — accurate values, items, tax, shipping
- Real-time attribution
- Supports Enhanced Conversions for Web

**Cons**:
- Requires Google Ads API access + developer token
- Must store and manage `gclid` per session
- More complex initial setup

**Implementation Pattern**:
```ts
// apps/backend/src/subscribers/marketing/google-ads-order-placed.ts
export default async function googleAdsOrderPlacedHandler({
  data,
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderService = container.resolve(Modules.ORDER)
  const order = await orderService.retrieve(data.id, {
    relations: ["customer", "items", "items.variant", "items.variant.product"],
  })

  const gclid = await getGclidFromSession(order.customer_id)
  if (!gclid) return // not from ad click

  const conversionActionId = process.env.GOOGLE_ADS_CONVERSION_ACTION_ID
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID

  await googleAdsClient.conversionUploads.uploadClickConversions({
    customerId,
    conversions: [{
      conversionAction: `customers/${customerId}/conversionActions/${conversionActionId}`,
      conversionDateTime: new Date().toISOString(),
      conversionValue: order.total / 100,
      currencyCode: order.currency_code,
      orderId: `order_${order.id}`,
      gclid,
      userIdentifiers: [
        { hashedEmail: await sha256(order.customer.email) },
        { hashedPhoneNumber: await sha256(order.customer.phone) },
      ],
    }],
  })
}
```

**Libraries**:
- `google-ads-api` (npm) — official Node.js client
- Or raw HTTP calls to `https://googleads.googleapis.com/v18/customers/{customerId}/conversionUploads:uploadClickConversions`

---

### Option B: GTM DataLayer + Server Container (Most Flexible)
Use Google Tag Manager as a multiplexer. The storefront pushes ecommerce events to `dataLayer`, GTM routes them to Google Ads, GA4, Meta Pixel, etc.

**How it works**:
1. Install GTM snippet on storefront
2. Push ecommerce events from storefront:
   ```ts
   dataLayer.push({ event: "purchase", transaction_id: "order_123", value: 99.99, currency: "USD", items: [...] })
   ```
3. In GTM, configure Google Ads conversion tags triggered on these events
4. Optionally use GTM server-side container for reliability

**Pros**:
- One integration → all ad platforms
- No backend changes needed for basic setup
- Non-technical marketers can manage tags in GTM UI
- Standard ecommerce platform pattern (Shopify, WooCommerce)

**Cons**:
- Client-side only by default — ad blockers affect it
- Requires GTM setup and tag configuration
- More moving parts

**Community Package**: `medusa-storefront-analytics` provides a GTM adapter pattern:
```ts
import { createGtmAnalyticsAdapter } from "medusa-storefront-analytics"
const analytics = createGtmAnalyticsAdapter()
analytics.trackPurchase({ orderId, total, items })
```

---

### Option C: Direct gtag.js Client-Side (Simplest)
Add Google Ads `gtag.js` snippet directly to the storefront and fire conversion events on order confirmation.

**How it works**:
1. Add global site tag to `layout.tsx`
2. On order confirmation page, fire conversion snippet:
   ```tsx
   useEffect(() => {
     if (typeof window !== "undefined" && (window as any).gtag) {
       (window as any).gtag("event", "conversion", {
         send_to: "AW-CONVERSION_ID/CONVERSION_LABEL",
         transaction_id: orderId,
         value: orderTotal,
         currency: "USD",
       })
     }
   }, [])
   ```

**Pros**:
- Fastest to implement
- No backend changes
- Standard Google Ads setup

**Cons**:
- Least reliable — blocked by ad blockers, iOS restrictions
- No Enhanced Conversions without additional server work
- Client can manipulate values

---

## 4. Recommended Architecture: Hybrid Approach

Combine **Option A** (server-side API) for reliability + **Option B** (GTM dataLayer) for flexibility.

### 4.1 Backend: Google Ads Subscriber + Service

Create a marketing plugin/module:

```
apps/backend/src/
  modules/
    marketing/
      models/
        marketing-attribution.ts    # stores gclid, conversion data
      service.ts
      index.ts
  subscribers/
    marketing/
      google-ads-order-placed.ts
      google-ads-cart-updated.ts   # optional, for add_to_cart
  workflows/
    marketing/
      track-google-ads-conversion.ts
```

**Key components**:

1. **Marketing Attribution Service**: stores `gclid`, `session_id`, conversion timestamps
2. **Google Ads Service**: wraps Google Ads API client, handles auth, retries
3. **Order Placed Subscriber**: fires on `order.placed`, calls Google Ads API with enhanced conversions
4. **Cart Updated Subscriber**: fires on `cart.updated`, tracks `add_to_cart` / `remove_from_cart` as secondary conversions

**Event mapping**:

| Medusa Event | Google Ads Conversion Action | Type |
|---|---|---|
| `order.placed` | Purchase | Primary |
| `cart.updated` (add item) | Add to cart | Secondary |
| `cart.updated` (remove item) | Remove from cart | Secondary |
| `customer.registered` | Sign-up | Secondary |
| `order.shipped` | Shipment | Secondary |

### 4.2 GCLID Capture Strategy

Store the `gclid` parameter when users land from Google Ads:

```ts
// apps/storefront/src/middleware.ts (extend existing)
export function middleware(request: NextRequest) {
  const gclid = request.nextUrl.searchParams.get("gclid")
  if (gclid) {
    const response = NextResponse.next()
    response.cookies.set("gclid", gclid, {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
      sameSite: "lax",
    })
    return response
  }
}
```

Pass `gclid` to backend:
- As cart metadata on creation: `body.metadata = { gclid: cookies.get("gclid") }`
- As customer metadata on registration
- Backend stores it and uses it for conversion upload

### 4.3 Frontend: GTM DataLayer Integration

Use the `medusa-storefront-analytics` package or build a lightweight GTM wrapper:

```ts
// apps/storefront/src/lib/marketing/gtm.ts
export const trackEvent = (eventName: string, params: Record<string, any>) => {
  if (typeof window !== "undefined" && (window as any).dataLayer) {
    (window as any).dataLayer.push({ event: eventName, ...params })
  }
}

export const trackPurchase = (order: Order) => {
  trackEvent("purchase", {
    transaction_id: order.id,
    value: order.total / 100,
    currency: order.currency_code,
    tax: order.tax_total / 100,
    shipping: order.shipping_total / 100,
    items: order.items.map((item) => ({
      item_id: item.variant_id,
      item_name: item.title,
      item_category: item.variant.product.categories?.[0]?.name,
      price: item.unit_price / 100,
      quantity: item.quantity,
    })),
  })
}
```

**Events to track**:

| Storefront Event | dataLayer Event | Trigger |
|---|---|---|
| Product list viewed | `view_item_list` | Home, category, collection pages |
| Product viewed | `view_item` | PDP mount |
| Add to cart | `add_to_cart` | Cart add success |
| Remove from cart | `remove_from_cart` | Cart remove success |
| View cart | `view_cart` | Cart page |
| Begin checkout | `begin_checkout` | Checkout step 1 |
| Add shipping info | `add_shipping_info` | Shipping step |
| Add payment info | `add_payment_info` | Payment step |
| Purchase | `purchase` | Order confirmation |
| Search | `search` | Search results |

### 4.4 Google Ads Conversion Actions Setup

In Google Ads UI, create these conversion actions:

1. **Purchase** (Primary)
   - Category: Purchase
   - Value: Use different value for each conversion
   - Count: Every
   - Attribution: 30-day click, 1-day view
   - Enhanced conversions: ON

2. **Add to Cart** (Secondary)
   - Category: Add to cart
   - Value: Use default value or dynamic
   - Count: Every
   - Enhanced conversions: ON

3. **Sign-up** (Secondary, if applicable)
   - Category: Sign-up
   - Count: One

---

## 5. Implementation Steps

### Phase 1: Backend Foundation
1. Create `apps/backend/src/modules/marketing/` with attribution model
2. Create Google Ads service wrapping API client
3. Add `gclid` capture middleware to storefront
4. Create `track-google-ads-conversion.ts` workflow

### Phase 2: Event Subscribers
1. `order.placed` → upload purchase conversion
2. `cart.updated` → upload add_to_cart / remove_from_cart
3. `customer.created` → upload sign-up conversion (optional)

### Phase 3: Storefront Tracking
1. Add GTM snippet to `layout.tsx` (or use direct gtag.js)
2. Create `lib/marketing/gtm.ts` with event helpers
3. Integrate `trackAddToCart` in cart actions
4. Integrate `trackPurchase` on order confirmation
5. Integrate `trackViewItem` on PDP

### Phase 4: Enhanced Conversions
1. Collect email/phone/address in order flow
2. Hash with SHA-256 before sending
3. Include in `userIdentifiers` array in API call
4. Accept customer data terms in Google Ads

### Phase 5: Testing & Validation
1. Use Google Ads API sandbox/test mode
2. Verify conversions in Google Ads UI (24-48h delay for API uploads)
3. Cross-check with GA4 data
4. Test deduplication between server-side and client-side

---

## 6. Code Architecture

### 6.1 Backend Module Structure

```
apps/backend/src/modules/marketing/
  models/
    marketing-attribution.ts
  service.ts
  index.ts
```

**marketing-attribution.ts**:
```ts
const MarketingAttribution = model.define("marketing_attribution", {
  id: model.id().primaryKey(),
  customer_id: model.text().nullable(),
  session_id: model.text(),
  gclid: model.text().nullable(),
  source: model.text().nullable(), // "google_ads"
  medium: model.text().nullable(), // "cpc"
  campaign_id: model.text().nullable(),
  converted: model.boolean().default(false),
  converted_at: model.date().nullable(),
  metadata: model.json().nullable(),
})
```

### 6.2 Google Ads Service

```ts
// apps/backend/src/services/google-ads.ts
import { GoogleAdsApi } from "google-ads-api"

export class GoogleAdsService {
  private client: GoogleAdsApi

  constructor() {
    this.client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
    })
  }

  async uploadConversion({
    customerId,
    conversionActionId,
    orderId,
    value,
    currency,
    gclid,
    userData,
  }: ConversionPayload) {
    const customer = this.client.Customer({
      customer_id: customerId,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
    })

    return customer.conversionUploads.uploadClickConversions({
      customer_id: customerId,
      conversions: [{
        conversion_action: `customers/${customerId}/conversionActions/${conversionActionId}`,
        conversion_date_time: new Date().toISOString(),
        conversion_value: value,
        currency_code: currency,
        order_id: orderId,
        gclid,
        user_identifiers: userData,
      }],
      partial_failure: true,
    })
  }
}
```

### 6.3 Subscriber Pattern

```ts
// apps/backend/src/subscribers/marketing/google-ads-order-placed.ts
import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

const uploadGoogleAdsConversionStep = createStep(
  "upload-google-ads-conversion-step",
  async ({ orderId }, { container }) => {
    const orderService = container.resolve(Modules.ORDER)
    const marketingService = container.resolve(MARKETING_MODULE)
    const googleAdsService = container.resolve("googleAdsService")

    const order = await orderService.retrieveWithTotals(orderId, {
      relations: ["customer", "items", "items.variant", "shipping_address"],
    })

    const attribution = await marketingService.getAttributionForOrder(orderId)
    if (!attribution?.gclid) return new StepResponse(null, null)

    await googleAdsService.uploadConversion({
      customerId: process.env.GOOGLE_ADS_CUSTOMER_ID!,
      conversionActionId: process.env.GOOGLE_ADS_CONVERSION_ACTION_ID!,
      orderId: `order_${order.id}`,
      value: order.total / 100,
      currency: order.currency_code,
      gclid: attribution.gclid,
      userData: {
        hashedEmail: await sha256(order.customer.email),
        hashedPhone: await sha256(order.customer.phone),
        hashedFirstName: await sha256(order.customer.first_name),
        hashedLastName: await sha256(order.customer.last_name),
      },
    })

    await marketingService.markConverted(orderId)
    return new StepResponse({ success: true }, { orderId })
  },
  async (_, { container }) => {
    // compensation — mark as not converted
  }
)
```

---

## 7. GTM DataLayer Alternative

If you prefer GTM over direct API calls:

### 7.1 Install medusa-storefront-analytics
```bash
pnpm add medusa-storefront-analytics
```

### 7.2 Configure Adapter
```ts
// apps/storefront/src/lib/analytics.ts
import { createGtmAnalyticsAdapter, composeAnalyticsAdapters } from "medusa-storefront-analytics"

export const analytics = composeAnalyticsAdapters([
  createGtmAnalyticsAdapter({
    containerId: process.env.NEXT_PUBLIC_GTM_ID!,
  }),
])
```

### 7.3 Track Events
```ts
// apps/storefront/src/lib/data/marketing.ts
"use server"
import { analytics } from "@lib/analytics"

export const trackAddToCart = (variant: ProductVariant) => {
  analytics.trackAddToCart({
    productId: variant.product_id,
    variantId: variant.id,
    name: variant.title,
    price: variant.calculated_price / 100,
    quantity: 1,
  })
}

export const trackPurchase = (order: Order) => {
  analytics.trackPurchase({
    orderId: order.id,
    total: order.total / 100,
    currency: order.currency_code,
    items: order.items.map((item) => ({
      productId: item.product_id,
      variantId: item.variant_id,
      name: item.title,
      price: item.unit_price / 100,
      quantity: item.quantity,
    })),
  })
}
```

### 7.4 GTM Configuration
In Google Tag Manager:
1. Create GA4 Configuration tag with your Measurement ID
2. Create Google Ads Conversion tag for Purchase event
3. Set trigger: Custom Event → `purchase`
4. Map dataLayer variables: `transaction_id`, `value`, `currency`, `items`
5. Enable Enhanced Conversions with user-provided data

---

## 8. Google Ads API vs GTM Comparison

| Aspect | Direct API (Option A) | GTM DataLayer (Option B) |
|--------|----------------------|--------------------------|
| **Reliability** | High — server-side, no ad blockers | Medium — client-side, can be blocked |
| **Accuracy** | Exact order data from backend | Depends on client data availability |
| **Enhanced Conversions** | Native support | Requires GTM configuration |
| **Multi-platform** | Need separate API calls per platform | GTM routes to all platforms |
| **Setup Complexity** | Higher — API auth, OAuth, developer token | Medium — GTM container + tags |
| **Maintenance** | Monitor API version changes | GTM handles platform updates |
| **Attribution** | Uses `gclid` from click | Uses `gclid` or cookie-based |
| **Real-time** | Near real-time (API latency) | Real-time (client-side) |
| **Cost** | Free API, but dev time | Free GTM + minimal dev time |

**Recommendation**: Use **Option A** for Purchase conversions (most critical, highest value), and **Option B** for secondary events (add_to_cart, view_item) where real-time client data is sufficient.

---

## 9. Privacy & Compliance

### 9.1 Consent Requirements
- **EU**: Require cookie consent before setting `gclid` cookie or firing tracking pixels
- **Enhanced Conversions**: Must accept customer data terms in Google Ads UI
- **GDPR**: Hash personal data before sending to Google Ads API

### 9.2 Data Handling
```ts
// Always hash sensitive data before sending
async function sha256(value: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(value.toLowerCase().trim())
  const hash = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("")
}
```

### 9.3 GCLID Storage
- Store in httpOnly cookie with 30-day expiry
- Associate with customer session/order
- Delete after conversion upload or expiry
- Never expose in client-side code

---

## 10. Environment Variables Required

```env
# Google Ads API
GOOGLE_ADS_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=your_client_secret
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token
GOOGLE_ADS_REFRESH_TOKEN=your_refresh_token
GOOGLE_ADS_CUSTOMER_ID=1234567890
GOOGLE_ADS_CONVERSION_ACTION_ID=purchase_conversion_action_id

# GTM (if using GTM approach)
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX

# GA4 (if using GA4 alongside)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
GA_API_SECRET=your_api_secret
```

---

## 11. Testing Strategy

### 11.1 Google Ads Test Conversions
1. Enable test mode in Google Ads account
2. Use test conversion action ID
3. Verify conversions appear in Google Ads UI within 24h
4. Check for `partial_failure` errors in API response

### 11.2 Debug Mode
```ts
// In Google Ads service
const DEBUG = process.env.GOOGLE_ADS_DEBUG === "true"
// Logs full request/response without affecting production data
```

### 11.3 Validation Checklist
- [ ] `gclid` captured from ad click and stored in cookie
- [ ] `gclid` passed to cart creation as metadata
- [ ] `gclid` associated with order on placement
- [ ] Conversion uploaded within 5 minutes of order
- [ ] Enhanced conversions hashed correctly
- [ ] Deduplication works (same order_id not counted twice)
- [ ] Conversions appear in Google Ads UI
- [ ] GA4 ecommerce events fire in parallel
- [ ] Ad blocker fallback works (client-side backup)

---

## 12. Future Enhancements

1. **Meta Pixel Integration**: Extend the same subscriber pattern to Meta Conversions API
2. **TikTok/ Pinterest Ads**: Add additional ad platform adapters
3. **Customer List Upload**: Upload customer lists for remarketing audiences
4. **Offline Conversion Import**: Import in-store/phone conversions
5. **Attribution Reporting**: Build internal dashboard showing ad performance
6. **A/B Testing**: Use conversion data to optimize ad spend

---

## 13. Sources

- Google Ads Conversions API: https://developers.google.com/google-ads/api/docs/conversions/overview
- Enhanced Conversions for Web: https://developers.google.com/google-ads/api/docs/conversions/enhanced-conversions/web
- GTM Server-Side Ads Setup: https://developers.google.com/tag-platform/tag-manager/server-side/ads-setup
- Google Ads Webhooks Guide (Luc Flynn): https://lucflynn.com/tracking/webhooks-google-ads-setup
- Medusa Analytics Module: https://docs.medusajs.com/resources/infrastructure-modules/analytics
- Medusa GTM Feature Request: https://github.com/medusajs/medusa/discussions/14865
- `medusa-storefront-analytics` package: https://www.npmjs.com/package/medusa-storefront-analytics
- `@variablevic/google-analytics-medusa`: https://github.com/VariableVic/google-analytics-medusa
- Local project context: `C:\Users\faarh\OneDrive\Documents\latest1\medusa-js`

---

*Research compiled: 2026-09-07*
*Based on MedusaJS v2.20.1, Google Ads API v18, and current marketing integration patterns*
