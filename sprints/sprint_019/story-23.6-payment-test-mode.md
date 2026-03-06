# Story 23.6 — Payment Flow in Test Mode (Launch Gate 6)

**Epic:** Launch Gate Sprint
**Sprint:** 019
**Priority:** CRITICAL
**Status:** TODO

## User Story

As Miguel (driver),
I want the payment process to complete successfully every time,
so I'm confident my attorney fee went through and my case moves forward.

## Scope

Verify 100% payment success in Stripe test mode across all happy-path and edge-case scenarios to pass Launch Gate 6.

## Test Cards to Verify

Use Stripe test card numbers — all with any future expiry and any CVC:

| Card Number | Scenario | Expected Result |
|---|---|---|
| `4242 4242 4242 4242` | Successful payment | Navigate to payment-success with amount + transactionId |
| `4000 0025 0000 3155` | Requires 3D Secure auth | 3DS modal appears, complete → success |
| `4000 0000 0000 9995` | Card declined | Inline error: "Your card was declined." |
| `4000 0000 0000 0069` | Expired card | Inline error: "Your card has expired." |
| `4000 0000 0000 0127` | Incorrect CVC | Inline error: "Your card's security code is incorrect." |
| `4000 0000 0000 0002` | Generic decline | Inline error: "Your card was declined." |

## Flow to Verify End-to-End

```
Driver logs in
→ Navigates to case with status "pay_attorney"
→ Clicks "Pay Attorney Fee" on case detail
→ Case Payment screen loads with correct amount and attorney name
→ Stripe card element mounts successfully
→ Driver enters test card
→ Clicks "Pay Now"
→ Payment processes (loading state shown)
→ On success: navigates to /driver/cases/:id/payment-success
→ Payment Success screen shows amount and transaction ID
→ "View Case" navigates back to case detail
→ Case status updated to reflect payment
```

## Acceptance Criteria

- [ ] Success card (`4242...`) completes full flow end-to-end in < 5 seconds
- [ ] Declined card shows inline error without page reload, pay button re-enabled
- [ ] 3DS card shows authentication modal, completes successfully
- [ ] Double-click on "Pay Now" does not create duplicate payment intent
- [ ] Payment success screen shows correct amount and transaction ID
- [ ] Case status visible on dashboard reflects payment (no stale state)
- [ ] All test scenarios documented in `sprints/sprint_019/payment-test-results.md`

## Backend Verification

```bash
# Verify payment.service.js handles idempotency keys
grep -n "idempotencyKey\|idempotency_key" backend/src/services/payment.service.js

# Verify confirm endpoint is protected by auth
grep -n "POST.*confirm\|verifyToken" backend/src/routes/payment.routes.js
```

## Files to Modify (if issues found)

- `backend/src/services/payment.service.js` — add idempotency key if missing
- `frontend/src/app/features/driver/case-payment/case-payment.component.ts` — disable button during processing
- `frontend/cypress/e2e/payment-flow.cy.ts` — create E2E test covering all 6 card scenarios

## Test Coverage Matrix

| Source File | Test File | Status |
|---|---|---|
| `case-payment.component.ts` | `case-payment.component.spec.ts` | ✅ exists |
| `payment-success.component.ts` | `payment-success.component.spec.ts` | ✅ exists |
| `backend/services/payment.service.js` | `payment.service.test.js` | ✅ exists |
| `frontend/cypress/e2e/payment-flow.cy.ts` | (is the E2E test) | ❌ create |
