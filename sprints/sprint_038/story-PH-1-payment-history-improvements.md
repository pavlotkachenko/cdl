# Story PH-1: Payment History & Stripe Guard Improvements

**Status:** DONE

## Description
Enhance the shared payment history component with expanded UI and functionality. Add a
null guard to Stripe initialization in the backend payment service to prevent crashes when
`STRIPE_SECRET_KEY` is not configured.

## Acceptance Criteria
- [x] Payment history component template enhanced with additional display fields
- [x] Payment history component styles improved
- [x] Payment history component logic expanded
- [x] Backend Stripe initialization guarded against missing API key

## Files Changed
- `frontend/src/app/features/shared/payment/payment-history/payment-history.component.html` — enhanced template
- `frontend/src/app/features/shared/payment/payment-history/payment-history.component.scss` — new styles
- `frontend/src/app/features/shared/payment/payment-history/payment-history.component.ts` — expanded logic
- `backend/src/services/payment.service.js` — Stripe null guard for missing STRIPE_SECRET_KEY
