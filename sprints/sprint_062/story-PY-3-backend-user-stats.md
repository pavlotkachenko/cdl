# Story PY-3 — Backend: Add Per-User Payment Stats Endpoint

## Status: DONE

## Description
Add a new endpoint `GET /api/payments/user/me/stats` that returns payment KPI data for the authenticated user. The existing `/api/payments/stats` is admin/operator-only and returns global stats. The driver needs their own aggregated view for the 4 KPI cards.

## Files to Modify
- `backend/src/services/payment.service.js` — add `getUserPaymentStats(userId)` method
- `backend/src/controllers/payment.controller.js` — add `getUserPaymentStats` handler
- `backend/src/routes/payment.routes.js` — add route

## New Endpoint

### `GET /api/payments/user/me/stats`

**Response:**
```json
{
  "total_amount": 1145.00,
  "paid_amount": 650.00,
  "pending_amount": 120.00,
  "failed_amount": 375.00,
  "refunded_amount": 200.00,
  "transaction_count": 4,
  "paid_count": 2,
  "pending_count": 1,
  "failed_count": 1,
  "refunded_count": 0,
  "currency": "USD"
}
```

## Hidden Requirements
1. **User-scoped**: Must filter by `user_id = req.user.id` — drivers must never see other users' stats
2. **All-time totals**: KPI cards in the template show "All-time billing" — no date filtering on stats
3. **Status mapping**: `total_amount` = sum of ALL payments regardless of status. `paid_amount` = sum where `status = 'succeeded'`. `pending_amount` = sum where `status = 'pending'`. Template shows these as separate KPI values.
4. **Refund handling**: Refunds are separate records in `payment_refunds` table, but the template shows refunds as positive amounts in the transaction list. The `refunded_amount` stat should come from `payments` where `status = 'refunded'`, not from `payment_refunds`.
5. **Currency**: All amounts assumed USD for now. Return `currency: "USD"` for frontend formatting.
6. **Single query optimization**: Fetch all user payments once, compute aggregates in JS rather than making 4 separate DB queries.

## Acceptance Criteria
- [x] Endpoint returns all KPI values for the authenticated user
- [x] Only the user's own payments are aggregated
- [x] All status categories computed correctly
- [x] Route added before `/:id` catch-all to avoid route conflict
- [x] Handles users with zero payments (all values 0)
