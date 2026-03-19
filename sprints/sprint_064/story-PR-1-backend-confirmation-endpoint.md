# Story PR-1: Backend — Enriched Payment Confirmation Endpoint

## Meta

- **Sprint:** 064
- **Priority:** P0
- **Status:** DONE
- **Batch:** 1 (no dependencies)

## User Story

**As** Miguel (Driver),
**I want** to see my full payment details, case info, and attorney info on the payment confirmation screen,
**So that** I feel confident the transaction went through and know who is handling my case.

## Scope

### Files to modify

| File | Action |
|------|--------|
| `backend/src/services/payment.service.js` | Add `getPaymentConfirmation()` method |
| `backend/src/controllers/payment.controller.js` | Add `getPaymentConfirmation` handler |
| `backend/src/routes/payment.routes.js` | Add `GET /confirmation/:paymentIntentId` route |
| `backend/src/__tests__/payment.service.test.js` | Add tests for `getPaymentConfirmation` |
| `backend/src/__tests__/payment.controller.test.js` | Add tests for confirmation endpoint |

### API Contract

**`GET /api/payments/confirmation/:paymentIntentId`**

Requires: `authenticate` middleware

Response (200):
```json
{
  "success": true,
  "data": {
    "amount": 450.00,
    "currency": "USD",
    "status": "succeeded",
    "transaction_id": "ch_3TCZNPId4G1EJdt70sH3sHfC",
    "stripe_payment_intent_id": "pi_3TCZNPId4G1EJdt70sH3sHfC",
    "paid_at": "2026-03-18T15:42:00.000Z",
    "card_brand": "visa",
    "card_last4": "4242",
    "case": {
      "id": "uuid",
      "case_number": "CASE-2026-000847",
      "violation_type": "speeding",
      "violation_location": "I-35 North, Texas"
    },
    "attorney": {
      "name": "Sarah Johnson",
      "initials": "SJ"
    },
    "driver_email": "driver@test.com"
  }
}
```

Error responses:
- 404: `{ "success": false, "message": "Payment not found" }`
- 403: `{ "success": false, "message": "Access denied" }`

### Implementation Notes

- `getPaymentConfirmation(paymentIntentId, userId)` in payment.service.js:
  1. Query `payments` by `stripe_payment_intent_id`
  2. Verify `user_id === userId` (auth guard)
  3. Join `cases` on `payment.case_id` for case_number, violation_type, violation_location
  4. Join `users` on `cases.assigned_attorney_id` for attorney full_name
  5. Join `users` on `payment.user_id` for driver email
  6. Compute `attorney.initials` from full_name (first letter of each word)
- Route must be placed ABOVE `/:id` in payment.routes.js to avoid param conflict

## Acceptance Criteria

- [ ] Endpoint returns all fields listed in the API contract above
- [ ] 403 if payment `user_id` does not match authenticated user
- [ ] 404 if no payment found for the given paymentIntentId
- [ ] Attorney initials computed correctly (e.g., "Sarah Johnson" -> "SJ")
- [ ] Gracefully handles missing attorney (returns `attorney: null`)
- [ ] Gracefully handles missing card details (returns `card_brand: null, card_last4: null`)
- [ ] Tests cover: success path, auth guard (403), not found (404), missing attorney, missing card details

## Test Coverage Matrix

| Source File | Test File | Action |
|------------|-----------|--------|
| `backend/src/services/payment.service.js` | `backend/src/__tests__/payment.service.test.js` | Update |
| `backend/src/controllers/payment.controller.js` | `backend/src/__tests__/payment.controller.test.js` | Update |
