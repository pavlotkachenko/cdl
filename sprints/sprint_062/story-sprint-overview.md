# Sprint 062 — Driver Payments Page Redesign

## Theme
Complete visual and functional redesign of the Driver Payment History page to match the new HTML design template. Replaces the existing Material-table-based layout with a custom-styled table, 4 KPI summary cards, advanced filter card with active chips, custom pagination, enriched transaction rows with card brand display, row hover actions, and emoji icon integration.

## Existing State
- **Component**: `frontend/src/app/features/shared/payment/payment-history/`
- **Backend**: `payment.service.js` + `payment.controller.js` with routes at `/api/payments/`
- **DB**: `payments` table (migration 011) with `case_id`, `user_id`, `amount`, `status`, `payment_method`, `description`, `metadata`
- **Route**: `/driver/payments` lazy-loads `PaymentHistoryComponent` from shared

## Stories

| ID | Title | Scope | Status |
|----|-------|-------|--------|
| PY-1 | DB Migration — add card_brand, card_last4 to payments | Backend/DB | DONE |
| PY-2 | Backend — enrich getUserPayments with case + card details | Backend | DONE |
| PY-3 | Backend — add per-user payment stats endpoint | Backend | DONE |
| PY-4 | Backend — add retry-payment endpoint | Backend | DONE |
| PY-5 | Frontend — KPI summary cards | Frontend | DONE |
| PY-6 | Frontend — filter card with active chips | Frontend | DONE |
| PY-7 | Frontend — custom table with enriched rows | Frontend | DONE |
| PY-8 | Frontend — custom pagination | Frontend | DONE |
| PY-9 | Frontend — empty state + loading state | Frontend | DONE |
| PY-10 | Frontend — row actions (receipt, details, retry) | Frontend | DONE |
| PY-11 | Frontend — CSV export of filtered data | Frontend | DONE |
| PY-12 | Frontend — Angular modernization (signals, OnPush, inject) | Frontend | DONE |
| PY-13 | Frontend — SCSS redesign to match template | Frontend | DONE |
| PY-14 | Tests — full coverage for all changes | Testing | DONE |

## Dependencies
- PY-1 must complete first (DB migration)
- PY-2, PY-3, PY-4 depend on PY-1 (backend needs new columns)
- PY-5 depends on PY-3 (stats endpoint)
- PY-6, PY-7, PY-8, PY-9 can run in parallel after PY-2
- PY-10 depends on PY-4 (retry endpoint) and PY-7 (table exists)
- PY-11 depends on PY-7 (filtered data available)
- PY-12 can run in parallel with PY-5–PY-11
- PY-13 runs alongside all frontend stories
- PY-14 runs last (covers all changes)

## Key Risks
- `payment_method` column currently stores a string — enriching with card_brand/last4 requires Stripe API call during payment creation (or retrospective backfill)
- Replacing mat-table + mat-paginator with custom HTML table loses built-in sorting/pagination — must reimplement manually
- Template uses "Paid" status label but Stripe uses "succeeded" — need mapping layer
- Row hover actions require CSS-only show/hide (opacity transition) for accessibility
