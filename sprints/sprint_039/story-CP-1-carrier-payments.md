# Story CP-1: Carrier Payments Page

**Status:** DONE

## Description
New payments page for the carrier portal showing payment history with summary cards
(total paid, pending, transaction count) and a detailed payment list with status indicators.

## Acceptance Criteria
- [x] Summary cards show total paid, pending amount, and transaction count
- [x] Payment list with status icons (check_circle/schedule/error)
- [x] Amount colored by status (green=paid, orange=pending, red=failed with strikethrough)
- [x] Signals + OnPush + standalone component
- [x] Responsive grid (3-column on desktop, 1 on mobile)
- [x] Route: `/carrier/payments` (lazy-loaded)

## Files Changed
- `frontend/src/app/features/carrier/payments/carrier-payments.component.ts` — new component
- `frontend/src/app/features/carrier/carrier-routing.module.ts` — added payments route
