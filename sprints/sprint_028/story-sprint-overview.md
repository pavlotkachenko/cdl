# Sprint 028 — Subscription Billing Portal

**Theme:** Give attorneys self-service billing management and full invoice history via Stripe Billing Portal.

**Status:** DONE

---

## Stories

| ID | Title | Status |
|----|-------|--------|
| [SB-1](story-SB-1-billing-portal-backend.md) | Billing Portal + Invoice History — Backend | DONE |
| [SB-2](story-SB-2-subscription-ui-update.md) | Subscription Management UI Enhancement | DONE |
| [SB-3](story-SB-3-tests.md) | Billing Tests | DONE |

---

## Changes Summary

- `subscription.service.js` — added `createBillingPortalSession`, `getInvoices`
- `subscription.controller.js` — added `createBillingPortalSession`, `getInvoices` handlers
- `subscription.routes.js` — new routes `POST /portal`, `GET /invoices`
- `subscription.service.ts` (frontend) — added `getBillingPortalUrl()`, `getInvoices()`, `BillingInvoice` interface
- `subscription-management.component.ts` — replaced Cancel dialog with "Manage Billing" portal button; added invoice history table
- Deleted: `cancel-subscription-dialog/` component (replaced by Stripe portal)
- `backend/src/__tests__/subscription.billing.test.js` — new Jest tests
- `subscription-management.component.spec.ts` — updated specs
