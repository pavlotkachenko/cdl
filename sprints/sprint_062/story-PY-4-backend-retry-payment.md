# Story PY-4 — Backend: Add Retry Payment Endpoint

## Status: DONE

## Description
Add an endpoint `POST /api/payments/:id/retry` that allows a driver to retry a failed payment. This creates a new Stripe PaymentIntent for the same case and amount, superseding the failed one.

## Files to Modify
- `backend/src/services/payment.service.js` — add `retryPayment(paymentId, userId)` method
- `backend/src/controllers/payment.controller.js` — add `retryPayment` handler
- `backend/src/routes/payment.routes.js` — add route

## New Endpoint

### `POST /api/payments/:id/retry`

**Request:** No body required (uses original payment's case and amount)

**Response:**
```json
{
  "payment": {
    "id": "new-uuid",
    "case_id": "original-case-id",
    "amount": 375.00,
    "currency": "USD",
    "status": "pending",
    "stripe_payment_intent_id": "pi_new_xxx",
    "client_secret": "pi_new_xxx_secret_xxx"
  }
}
```

## Hidden Requirements
1. **Authorization**: Only the user who owns the original payment can retry it (`payment.user_id === req.user.id`)
2. **Status check**: Only payments with `status = 'failed'` can be retried. Return 400 for other statuses.
3. **Original payment preserved**: The failed payment record stays as-is. A new payment record is created with a new Stripe PaymentIntent.
4. **Same case, same amount**: The retry uses the same `case_id` and `amount` from the original payment.
5. **Frontend flow**: After retry, the frontend receives a `client_secret` and must present the Stripe card element again for the user to enter (potentially different) card details. This means the retry endpoint returns a client_secret like `createPaymentIntent`.
6. **Duplicate prevention**: If a pending or succeeded payment already exists for the same case_id, return 409 Conflict.
7. **Rate limiting consideration**: Multiple rapid retries could create orphaned PaymentIntents in Stripe. Consider adding a cooldown (e.g., 60 seconds between retries) checked via `created_at` of the most recent payment for that case.

## Acceptance Criteria
- [x] Only failed payments can be retried
- [x] Only the payment owner can retry
- [x] New payment record + Stripe PaymentIntent created
- [x] client_secret returned for frontend card entry
- [x] Original failed payment unchanged
- [x] 409 returned if a pending/succeeded payment exists for the case
- [x] Cooldown enforced (60s between retries for same case)
