# Story LH-5 — Payment Flow Cypress E2E

**Sprint:** 026 — Launch Hardening
**Status:** DONE

## Scope

Create Cypress E2E tests for the full payment flow covering all 6 Stripe test card scenarios specified in Sprint 019 story 23.6.

## Changes

### `frontend/cypress/e2e/payment-flow.cy.ts` — CREATED

8 test scenarios across 7 describe blocks. All use `cy.intercept` for mock Stripe/backend responses — no real network calls required.

| Scenario | Card / Mock | Expected Outcome |
|---|---|---|
| Success | `4242 4242 4242 4242` | Navigates to `/driver/cases/:id/payment-success` with amount + transactionId |
| Card declined | `4000 0000 0000 0002` | Inline error: "Your card was declined." Pay button re-enabled |
| Insufficient funds | `4000 0000 0000 9995` | Inline error: "Your card has insufficient funds." |
| 3D Secure required | `4000 0000 0000 3220` | 3DS modal appears; on complete → success navigation |
| Expired card | `4000 0000 0000 0069` | Inline error: "Your card has expired." |
| Wrong CVC | `4000 0000 0000 0127` | Inline error: "Your card's security code is incorrect." |
| Backend 404 (case not found) | `cy.intercept` 404 | Redirects to `/driver/dashboard` with snackBar |
| Backend 500 (payment intent fail) | `cy.intercept` 500 | SnackBar error, stays on payment page |

## Test Coverage Matrix

| Flow | Test File | Status |
|---|---|---|
| Payment flow — 8 Stripe scenarios | `frontend/cypress/e2e/payment-flow.cy.ts` | ✅ |
