# Story SB-1 — Billing Portal + Invoice History Backend

**Sprint:** 028 — Subscription Billing Portal
**Status:** DONE

## User Story

As James (attorney),
I want to manage my payment method, upgrade/downgrade my plan, and download invoices without contacting support,
so I have full control over my subscription billing.

## Changes

### `backend/src/services/subscription.service.js` — UPDATED

**`createBillingPortalSession(userId, returnUrl)`**
- Looks up or creates a Stripe customer by user email
- Creates a `stripe.billingPortal.sessions` session with `return_url`
- Falls back to `returnUrl` (or `APP_URL/attorney/subscription`) when Stripe is not configured — safe for local dev

**`getInvoices(userId)`**
- Looks up Stripe customer by user email
- Fetches last 10 invoices via `stripe.invoices.list`
- Maps to `{ id, amount, currency, status, date, pdf_url, hosted_url }`
- Returns `[]` when Stripe is not configured or user has no customer record

### `backend/src/controllers/subscription.controller.js` — UPDATED

- `exports.createBillingPortalSession` — calls service, returns `{ url }`; 404 if user not found, 500 on error
- `exports.getInvoices` — calls service, returns `{ invoices: [] }`

### `backend/src/routes/subscription.routes.js` — UPDATED

```
POST /api/subscriptions/portal    → createBillingPortalSession  (verifyToken)
GET  /api/subscriptions/invoices  → getInvoices                 (verifyToken)
```

## Acceptance Criteria

- [x] `POST /portal` returns Stripe portal URL for authenticated attorney
- [x] `POST /portal` returns fallback URL when Stripe not configured
- [x] `GET /invoices` returns last 10 invoices with amount, status, PDF link
- [x] `GET /invoices` returns `[]` when user has no Stripe customer record
- [x] Both endpoints protected by `verifyToken` middleware

## Test Coverage Matrix

| Source File | Test File | Status |
|---|---|---|
| `subscription.service.js` (`createBillingPortalSession`, `getInvoices`) | `subscription.billing.test.js` | ✅ |
| `subscription.controller.js` | `subscription.billing.test.js` | ✅ |
