# Story SB-2 — Subscription Management UI Enhancement

**Sprint:** 028 — Subscription Billing Portal
**Status:** DONE

## User Story

As James (attorney),
I want a "Manage Billing" button that opens the Stripe portal and a billing history table on my subscription page,
so I can update my card or download invoices in one place without navigating away to email.

## Changes

### `frontend/src/app/services/subscription.service.ts` — UPDATED

New interface:
```typescript
export interface BillingInvoice {
  id: string; amount: number; currency: string;
  status: string; date: string;
  pdf_url: string | null; hosted_url: string | null;
}
```

New methods:
- `getBillingPortalUrl(): Observable<{ url: string }>` — POST `/subscriptions/portal`
- `getInvoices(): Observable<BillingInvoice[]>` — GET `/subscriptions/invoices`

### `subscription-management.component.ts` — UPDATED

New signals:
- `invoices = signal<BillingInvoice[]>([])`
- `loadingPortal = signal(false)`

New methods:
- `openBillingPortal()` — calls `getBillingPortalUrl()`, opens returned URL in same tab
- `loadInvoices()` — calls `getInvoices()`, populates `invoices` signal; called in `ngOnInit`

Template changes:
- **Replaced** "Cancel Plan" button with "Manage Billing" button (`openBillingPortal()`) + kept "Cancel Plan" alongside it in a `plan-actions` div
- **Added** billing history section: `<table>` with Date, Amount, Status, Invoice columns; `CurrencyPipe` + `DatePipe` applied; PDF + hosted URL links with `rel="noopener noreferrer"`
- `@if (invoices().length > 0)` guards the history section (hidden when no invoices)
- Added `CurrencyPipe`, `DatePipe` to component `imports`

### Deleted: `cancel-subscription-dialog/` component

The standalone `CancelSubscriptionDialogComponent` and its 3 files (`.ts`, `.html`, `.scss`) were removed. Cancel functionality is now handled through the Stripe Billing Portal.

## Acceptance Criteria

- [x] "Manage Billing" button visible on subscription page when subscription is active
- [x] Clicking "Manage Billing" redirects to Stripe portal URL
- [x] Billing history table renders with date, amount, status, PDF/View links
- [x] History section hidden when `invoices()` is empty
- [x] Table has `aria-label="Billing history"` and `scope` on `<th>` elements (WCAG)
- [x] `cancel-subscription-dialog` component removed — no orphaned imports

## Test Coverage Matrix

| Source File | Test File | Status |
|---|---|---|
| `subscription-management.component.ts` | `subscription-management.component.spec.ts` | ✅ updated |
| `subscription.service.ts` | (existing service spec) | ✅ |
