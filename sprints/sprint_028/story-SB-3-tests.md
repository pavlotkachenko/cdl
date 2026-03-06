# Story SB-3 — Billing Tests

**Sprint:** 028 — Subscription Billing Portal
**Status:** DONE

## Scope

New Jest test file covering all backend billing functions added in SB-1. Component spec updates for SB-2 UI changes.

## `backend/src/__tests__/subscription.billing.test.js` — CREATED

Pattern: `jest.resetModules()` in `beforeEach` + `require` inside each test so the Supabase mock instance matches the one the service binds at module load time.

| Describe Block | Tests |
|---|---|
| `createBillingPortalSession (SB-1)` | returns fallback URL when Stripe not configured; uses `APP_URL` as default return URL; creates portal session via Stripe for existing customer; creates new Stripe customer when none exists; throws when user not found in DB |
| `getInvoices (SB-5)` | returns `[]` when Stripe not configured; returns `[]` when no Stripe customer found; returns mapped invoices array for known customer |

### `subscription-management.component.spec.ts` — UPDATED

Updated to reflect:
- `openBillingPortal()` method instead of cancel dialog
- `loadInvoices()` called on init
- Invoice table renders when `invoices()` is non-empty
- Invoice table hidden when `invoices()` is empty

## Test Coverage Matrix

| Source File | Test File | Status |
|---|---|---|
| `subscription.service.js` (billing functions) | `subscription.billing.test.js` | ✅ |
| `subscription-management.component.ts` | `subscription-management.component.spec.ts` | ✅ |
