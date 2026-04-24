# Stripe + Razorpay Payment Integration Design

**Date:** 2026-04-24  
**Project:** ECOM  
**Status:** Approved

---

## Overview

Integrate real Stripe (card payments via Stripe Elements) and Razorpay (UPI/Netbanking/Cards via Razorpay popup modal) into the existing checkout flow. Payment confirmation is handled server-side via webhooks. Unpaid orders are auto-cancelled after 30 minutes via a cron job.

---

## Architecture

### Flow

```
User fills shipping → clicks Place Order
→ POST /api/orders          (creates order: isPaid=false, status='pending', expiresAt=now+30m)
→ if Stripe selected:
    POST /api/payment/stripe → { clientSecret }
    → Stripe Elements card form → stripe.confirmCardPayment(clientSecret)
    → Stripe webhook fires → server marks order paid
→ if Razorpay selected:
    POST /api/payment/razorpay → { id, amount, currency }
    → window.Razorpay({ ... }) modal opens → user pays
    → Razorpay webhook fires → server marks order paid
→ if Cash on Delivery:
    order placed directly, isPaid stays false until delivery
→ User sees success screen
```

### Webhook Security

- **Stripe:** `stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET)` — webhook route uses `express.raw()` middleware, not `express.json()`
- **Razorpay:** `crypto.createHmac('sha256', RAZORPAY_KEY_SECRET).update(body).digest('hex')` compared against `X-Razorpay-Signature` header

---

## Backend

### Dependencies to Install

```
stripe
razorpay
node-cron
```

### Order Model Changes

Add two fields to `src/models/Order.js`:

| Field | Type | Default | Description |
|---|---|---|---|
| `expiresAt` | Date | `now + 30 minutes` | Deadline for payment before auto-cancel |
| `status` | String (enum) | `'pending'` | `pending` / `paid` / `cancelled` / `delivered` |

Keep existing `isPaid` and `isDelivered` booleans for backwards compatibility with admin views. When `status` is set to `'paid'`, also set `isPaid = true`. When `status` is set to `'delivered'`, also set `isDelivered = true`.

### Payment Controller (`src/controllers/paymentController.js`)

Replace all mocks with real SDK calls:

| Route | Method | Description |
|---|---|---|
| `GET /api/config/stripe` | Protected | Returns `STRIPE_PUBLISHABLE_KEY` |
| `GET /api/config/razorpay` | Protected | Returns `RAZORPAY_KEY_ID` |
| `POST /api/payment/stripe` | Protected | Creates Stripe PaymentIntent, returns `{ clientSecret }` |
| `POST /api/payment/razorpay` | Protected | Creates Razorpay Order, returns `{ id, amount, currency }` |
| `POST /api/payment/stripe/webhook` | Public (raw body) | Verifies Stripe signature, marks order paid |
| `POST /api/payment/razorpay/webhook` | Public | Verifies Razorpay signature, marks order paid |

**Stripe PaymentIntent:** Amount in paise (multiply INR by 100), currency `'inr'`, metadata includes `orderId`. After creating the intent, update the order: `paymentResult.id = paymentIntent.id`.

**Razorpay Order:** Amount in paise, currency `'INR'`, receipt is the order `_id.toString()`. After creating the Razorpay order, update the MongoDB order: `paymentResult.id = razorpayOrder.id`.

**Webhook handlers:** Both look up the MongoDB order using `paymentResult.id` (which was stored when the payment intent/order was created). On match: set `status = 'paid'`, `isPaid = true`, `paidAt = now`, populate `paymentResult` fully, and save.

### Order Controller Changes (`src/controllers/orderController.js`)

- `addOrderItems`: set `expiresAt = new Date(Date.now() + 30 * 60 * 1000)` and `status = 'pending'` on creation
- `updateOrderToPaid`: also set `status = 'paid'`
- `updateOrderToDelivered`: also set `status = 'delivered'`

### Auto-Cancel Cron Job (`src/jobs/cancelExpiredOrders.js`)

- Runs every 5 minutes via `node-cron` (`'*/5 * * * *'`)
- Query: `{ isPaid: false, status: 'pending', expiresAt: { $lt: new Date() } }`
- Sets `status = 'cancelled'` on all matching orders
- Started in `src/server.js` on app boot

### Payment Routes (`src/routes/paymentRoutes.js`)

Webhook routes must use `express.raw({ type: 'application/json' })` for Stripe (added in `app.js` before the global `express.json()` middleware, scoped to the webhook path only).

### Environment Variables

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
```

---

## Frontend

### Dependencies to Install

```
@stripe/stripe-js
@stripe/react-stripe-js
```

### Updated Payment Options in `Checkout.tsx`

```
○ Credit / Debit Card (Stripe)
○ UPI / Cards / Netbanking (Razorpay)
○ Cash on Delivery
```

### New Component: `src/components/payment/StripePayment.tsx`

- Wraps `<CardElement>` from `@stripe/react-stripe-js`
- Props: `clientSecret: string`, `orderId: string`, `onSuccess: () => void`
- Calls `stripe.confirmCardPayment(clientSecret, { payment_method: { card } })`
- On success: calls `onSuccess()` which sets `orderPlaced = true` in parent
- On error: shows toast with error message
- Styled to match existing Card UI

### Razorpay Integration in `Checkout.tsx`

- Load Razorpay script via `useEffect` (appends script tag once on mount)
- After order created with Razorpay method: call `POST /api/payment/razorpay` → open modal
- Razorpay options prefill `name` and `email` from user auth context
- `handler` callback: show success screen (webhook confirms server-side)
- `modal.ondismiss`: show toast "Payment cancelled — your order will expire in 30 minutes"

### Checkout Flow Changes

1. User selects payment method
2. Clicks "Place Order" → `POST /api/orders` creates order
3. If **Stripe**: fetch `clientSecret` from `POST /api/payment/stripe` → render `<StripePayment>` component below the form
4. If **Razorpay**: fetch order from `POST /api/payment/razorpay` → open Razorpay modal
5. If **Cash on Delivery**: existing flow unchanged
6. On payment success: show existing success screen with order ID

### Profile Orders List

Cancelled orders show `status: Cancelled` badge with a "Reorder" button that pre-fills the cart with the same items.

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| Stripe card declined | Toast error from Elements, order stays pending |
| Razorpay modal dismissed | Toast "Payment cancelled — order expires in 30 min" |
| Webhook signature invalid | Return 400, log error, do not update order |
| Order already paid (duplicate webhook) | Check `isPaid` before updating, return 200 silently |
| Order expired before payment | Cron cancels it; user sees Cancelled status in profile |

---

## Testing

- Use Stripe test card `4242 4242 4242 4242` (any future expiry, any CVC)
- Use Razorpay test mode with `rzp_test_*` keys
- Test webhooks locally using Stripe CLI (`stripe listen --forward-to localhost:5000/api/payment/stripe/webhook`) and Razorpay dashboard test webhook
- Verify cron job by setting `expiresAt` to a past date in MongoDB and confirming status flips to `cancelled` within 5 minutes

---

## Out of Scope

- Refunds
- Partial payments
- Saved payment methods
- Currency switching (INR only)
