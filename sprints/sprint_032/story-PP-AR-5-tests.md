# Story PP-AR-5 — Tests

**Sprint:** 032 — Payment Plans + Auto Re-offer
**Priority:** P0
**Status:** DONE

## Scope

### Backend Tests

- `backend/src/__tests__/payment.plan.test.js` — CREATED
  - `getPaymentPlanOptions` returns 3 options with correct weekly amounts
  - `createPaymentPlan` creates Stripe intent + inserts schedule rows
  - 2-week plan: 2 installments 7 days apart
  - 4-week plan: 4 installments 7 days apart
  - 8-week plan: 8 installments 7 days apart
  - Invalid weeks (not 2/4/8) returns 400
  - Case not found returns 404

- `backend/src/__tests__/sms.service.test.js` — UPDATED (+1 test)
  - `sendPaymentReminderSms` calls Twilio with correct message format

- `backend/src/__tests__/payment-reminders.job.test.js` — CREATED
  - Finds installments due in 2 days and sends reminders
  - Skips already-reminded installments

- `backend/src/__tests__/case.decline.test.js` — CREATED
  - `declineCase` triggers `autoAssign` with exclusion list
  - Next attorney notified on successful re-offer
  - Declined attorney ID added to `declined_by_attorney_ids`
  - No eligible attorney → case stays `'new'`

- `backend/src/__tests__/assignment.service.test.js` — UPDATED (+2 tests)
  - `autoAssign` with `excludeAttorneyIds` skips excluded attorneys
  - Returns null when all candidates excluded

### Frontend Tests

- `frontend/src/app/features/driver/case-payment/case-payment.component.spec.ts` — UPDATED (+5 tests)
  - Plan options loaded on init
  - 4-week plan pre-selected by default
  - "Pay Now" flow unchanged
  - Plan selected → calls `POST /api/payments/create-plan`
  - Success screen shows installment schedule

## Totals (estimated)

- Backend: ~20 new tests
- Frontend: ~5 new tests
