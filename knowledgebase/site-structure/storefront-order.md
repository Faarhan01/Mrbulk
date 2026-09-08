# Storefront: Order Module Architecture

## Overview

The order module handles order confirmation, order details, and order transfer requests. This file documents the two order templates, the transfer flow, and the vestigial onboarding CTA.

## File Map

```
src/app/[countryCode]/(main)/
├── order/
│   └── [id]/
│       └── confirmed/page.tsx    ← order confirmation page
└── order/
    └── [id]/
        └── transfer/
            └── [token]/
                ├── page.tsx       ← transfer request form
                ├── accept/page.tsx ← accept transfer
                └── decline/page.tsx ← decline transfer

src/modules/order/
├── templates/
│   ├── order-completed-template.tsx  ← thank-you page
│   └── order-details-template.tsx    ← full order view
├── components/
│   ├── order-details/                ← order metadata
│   ├── items/                        ← order items list
│   ├── item/                         ← single order item
│   ├── shipping-details/             ← shipping address display
│   ├── payment-details/              ← payment method display
│   ├── order-summary/                ← totals
│   ├── help/                         ← help text
│   ├── transfer-actions/             ← accept/decline buttons
│   ├── transfer-image/               ← transfer QR/image
│   └── onboarding-cta/               ← legacy admin link
```

## Order Confirmed Page

`app/[countryCode]/(main)/order/[id]/confirmed/page.tsx`:

- Async server component.
- Calls `retrieveOrder(params.id)` (no `fields` parameter) to get the order. Uses `.catch(() => null)` and renders `notFound()` if missing.
- Renders `<OrderCompletedTemplate>`.

## OrderCompletedTemplate

`modules/order/templates/order-completed-template.tsx`:

### Structure
- Centered thank-you layout with order summary.
- Shows: order number, date, items table, shipping address, billing address, payment method, totals.
- Renders `<CartTotals totals={order}>` for the totals section.
- Renders `<Help>` with contact/return policy text.

### Onboarding CTA
Checks the `_medusa_onboarding` cookie. If present and not cleared, renders `<OnboardingCta>` which calls `resetOnboardingState(orderId)` to clear the cookie and redirect to `http://localhost:7001/a/orders/{orderId}`. This is the **legacy v1 admin port** — the CTA is vestigial in Medusa 2.x and not used in the current admin flow.

**Note**: This onboarding redirect is dead code in the v2 flow. It exists because the seed script sets the `_medusa_onboarding` cookie, but the v2 admin at `/app` does not use it.

## OrderDetailsTemplate

`modules/order/templates/order-details-template.tsx`:

- Renders a full order view with a back link to `/account/orders`.
- Uses `<OrderDetails>` for metadata, `<Items>` + `<Item>` for line items, `<ShippingDetails>` and `<PaymentDetails>` for addresses/payment, `<OrderSummary>` for totals.
- This is the same component tree as `OrderCompletedTemplate` but without the thank-you header.

## Order Transfer Flow

The transfer feature lets a customer share an order with another person via a tokenized link.

### Routes
| Route | Purpose |
|---|---|
| `/order/[id]/transfer/[token]` | Create / view transfer request |
| `/order/[id]/transfer/[token]/accept` | Accept transfer |
| `/order/[id]/transfer/[token]/decline` | Decline transfer |

### Data Layer
`src/lib/data/orders.ts`:
- `createTransferRequest(orderId)` — creates a transfer request with a token.
- `acceptTransferRequest(token)` — accepts the transfer.
- `declineTransferRequest(token)` — declines the transfer.

### UI Components
- `TransferRequestForm` — form to create a transfer request (email + message).
- `TransferActions` — renders accept/decline buttons if the viewer has the token.
- `TransferImage` — renders a QR code or shareable link image.

## Order List

`app/[countryCode]/(main)/account/@dashboard/orders/page.tsx`:

- Calls `listOrders()` after `retrieveCustomer()` auth gate (BUG-01 fixed).
- Renders `OrderOverview` with the list of orders.
- Each order shows: order number, date, total, fulfillment status, payment status.
- Links to `/order/{id}/confirmed` for the confirmation page, or to `/account/orders/details/{id}` for full details.

## Data-Test IDs

| Element | `data-testid` |
|---|---|
| Order container | `order-container` |
| Order item | `order-item` |
| Order summary | `order-summary` |
| Transfer accept button | `accept-transfer-button` |
| Transfer decline button | `decline-transfer-button` |
