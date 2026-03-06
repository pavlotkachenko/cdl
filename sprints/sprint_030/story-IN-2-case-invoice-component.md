# Story IN-2 — Case Invoice Section Component

**Sprint:** 030 — Rating System + Invoicing
**Status:** DONE

## User Story

As Miguel (driver) or James (attorney),
I want to view and print the invoice for a resolved case directly from the case detail page,
so I have a record of payment without leaving the app.

## Changes

### `frontend/src/app/features/driver/case-invoice/case-invoice-section.component.ts` — CREATED

- Embeddable component for displaying an invoice within a case detail page
- `input()`: `caseId: string`
- Signals: `invoice`, `loading`, `error`
- `ngOnInit` calls `GET /api/invoices/case/:caseId`, populates `invoice` signal
- `printInvoice()` — calls `window.print()` with print-specific CSS class applied
- Template: invoice number, driver name, attorney name, amount, date, status badge
- `@if (loading())` skeleton; `@if (error())` error state with retry

### Integration

Embedded in both:
- `frontend/src/app/features/driver/case-detail/case-detail.component.ts` — shown when `case.status === 'resolved'`
- `frontend/src/app/features/attorney/attorney-case-detail/attorney-case-detail.component.ts` — shown when case is resolved

## Acceptance Criteria

- [x] Invoice section renders with correct data when case is resolved
- [x] Hidden / not embedded when case is not yet resolved
- [x] Print button triggers `window.print()`
- [x] Loading skeleton shown while fetching
- [x] Error state shown when fetch fails

## Test Coverage Matrix

| Source File | Test File | Status |
|---|---|---|
| `case-invoice-section.component.ts` | `case-invoice-section.component.spec.ts` | ✅ |
