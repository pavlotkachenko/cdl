# Story 6.6 — Tests: payment.service.js

**Epic:** Backend Test Coverage
**Priority:** CRITICAL
**Status:** TODO

## User Story
As a developer,
I want unit tests for all payment flows,
so that refund guard logic and status update bugs are caught before they cost real money.

## Scope
- `createPaymentIntent` — ticket not found throws, existing payment throws, creates Stripe intent and DB record
- `confirmPayment` — updates payment to succeeded, updates ticket to paid, sends confirmation email
- `handlePaymentFailure` — updates payment to failed, reverts ticket to unpaid
- `processRefund` — payment not found throws, not-succeeded throws, refund > amount throws, full refund marks `refunded`, partial refund marks `succeeded`
- File: `backend/src/__tests__/payment.service.test.js`

## Acceptance Criteria
- [ ] `createPaymentIntent` throws when ticket not found or belongs to another user
- [ ] `createPaymentIntent` throws when a succeeded payment already exists for the ticket
- [ ] `confirmPayment` calls `sendPaymentConfirmationEmail` with amount, last4, transactionId
- [ ] `handlePaymentFailure` sets payment status to `failed` and ticket to `unpaid`
- [ ] `processRefund` throws when refund amount exceeds original payment
- [ ] Full refund sets payment status to `refunded` and ticket to `refunded`
- [ ] Partial refund sets payment status to `succeeded` and ticket to `partial_refund`
