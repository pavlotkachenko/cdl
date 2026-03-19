# Sprint 063 — Pay Attorney Fee Page Redesign

## Sprint Goal
Fix the broken Pay Attorney Fee page (infinite loading spinner) and redesign it to a 2-column layout with split Stripe Elements, attorney stats card, payment plan selector, and proper order summary.

## Status: DONE

## Root Cause Fixed
`payment.service.js` was referencing a non-existent `tickets` table (correct table: `cases`). All four affected methods now use `cases`/`case_id` correctly.

## Stories

| Story | Title | Status |
|-------|-------|--------|
| PA-1 | Fix `tickets`→`cases` references in payment.service.js + case.controller.js | DONE |
| PA-2 | Add attorney stats to case detail API response | DONE |
| PA-3 | Extract inline template/styles to external files | DONE |
| PA-4 | Redesign template to 2-column layout (HTML mockup) | DONE |
| PA-5 | Switch to split Stripe Elements (CardNumber/Expiry/CVC) | DONE |
| PA-6 | Backend test updates for payment.service | DONE |
| PA-7 | Frontend test updates for case-payment component | DONE |

## Files Modified

### Backend
- `backend/src/services/payment.service.js` — Fixed `createPaymentIntent`, `handlePaymentFailure`, `processRefund`, `getCasePayments` (was `getTicketPayments`)
- `backend/src/controllers/payment.controller.js` — Fixed `createPaymentIntent`, `confirmPayment` invoice email, `getCasePayments`
- `backend/src/routes/payment.routes.js` — Route updated from `/ticket/:ticketId` to `/case/:caseId`
- `backend/src/controllers/case.controller.js` — Fixed `createCasePayment` (ticketId→caseId param), enriched `getCaseById` with attorney stats
- `backend/src/__tests__/payment.service.test.js` — Full rewrite: 18 tests, all pass

### Frontend
- `frontend/src/app/features/driver/case-payment/case-payment.component.ts` — Split Stripe Elements, attorney stats signals, processingFee/totalAmount computed, new plan keys
- `frontend/src/app/features/driver/case-payment/case-payment.component.html` — NEW: 2-column layout with case summary, attorney card, plan selector, Stripe form, order summary
- `frontend/src/app/features/driver/case-payment/case-payment.component.scss` — NEW: Full responsive SCSS with ≤768px mobile breakpoint
- `frontend/src/app/features/driver/case-payment/case-payment.component.spec.ts` — 25 tests, all pass

## Test Results
- Backend payment.service.test.js: **18/18 pass**
- Frontend case-payment.component.spec.ts: **25/25 pass**

## Stripe Dashboard Visibility
PaymentIntent metadata now includes `caseNumber` (case number, not just UUID), `caseId`, and `userId` — all visible in the Stripe dashboard under Payment metadata.
