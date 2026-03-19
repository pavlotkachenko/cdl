# Story PY-2 — Backend: Enrich getUserPayments with Case + Card Details

## Status: DONE

## Description
Update the `getUserPayments` service method and controller to return enriched payment data including case number, violation type, attorney name, card brand, and card last 4 digits. Also add support for advanced filtering (date range, amount range, search, pagination, sorting).

## Files to Modify
- `backend/src/services/payment.service.js` — `getUserPayments()` method
- `backend/src/controllers/payment.controller.js` — `getUserPayments` handler
- `backend/src/services/payment.service.js` — `createPaymentIntent()` and `confirmPayment()` to store card details

## API Changes

### `GET /api/payments/user/me`

**New query parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `start_date` | ISO 8601 | Filter payments from this date |
| `end_date` | ISO 8601 | Filter payments until this date |
| `status` | string | Filter by status: `succeeded`, `pending`, `failed`, `refunded` |
| `min_amount` | number | Minimum amount (in dollars, not cents) |
| `max_amount` | number | Maximum amount (in dollars, not cents) |
| `search` | string | Search across description, case_number, violation_type |
| `sort_by` | string | Column to sort: `created_at` (default), `amount` |
| `sort_order` | string | `asc` or `desc` (default: `desc`) |
| `page` | number | Page number (1-based, default: 1) |
| `per_page` | number | Items per page (default: 10, max: 100) |

**Enriched response shape:**
```json
{
  "payments": [
    {
      "id": "uuid",
      "amount": 450.00,
      "currency": "USD",
      "status": "succeeded",
      "description": "Attorney Fee — CASE-2026-000058",
      "card_brand": "visa",
      "card_last4": "4242",
      "receipt_url": "https://receipt.stripe.com/...",
      "created_at": "2026-03-14T09:42:00Z",
      "paid_at": "2026-03-14T09:42:05Z",
      "case": {
        "id": "uuid",
        "case_number": "CASE-2026-000058",
        "violation_type": "speeding",
        "location": "I-35 Texas"
      },
      "attorney": {
        "name": "James Mitchell"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 10,
    "total": 42,
    "total_pages": 5
  }
}
```

## Hidden Requirements
1. **Supabase join**: Use `payments.select('*, cases(case_number, violation_type, location), cases.attorney:users!cases_attorney_id_fkey(full_name)')` or equivalent join to get case + attorney in one query
2. **Search across joined fields**: `search` param must search `description`, `cases.case_number`, and `cases.violation_type` — requires OR filter across tables
3. **Amount stored in dollars**: The `payments.amount` column stores dollars (DECIMAL 10,2), NOT cents. No conversion needed for filtering. However, the frontend component currently does `amount / 100` — this must be reconciled (check if amounts are already in dollars or cents in the DB)
4. **Pagination metadata**: Must return `total` count for the filtered dataset (use Supabase `count: 'exact'` option or a separate count query)
5. **Card details on payment creation**: When `confirmPayment()` succeeds, retrieve the PaymentMethod from Stripe (`stripe.paymentMethods.retrieve(paymentIntent.payment_method)`) and store `card.brand` and `card.last4` in the payments row
6. **receipt_url on confirmation**: After successful charge, retrieve charge via `stripe.charges.list({ payment_intent: intentId })` and store `charges.data[0].receipt_url`

## Acceptance Criteria
- [x] `getUserPayments` returns enriched objects with case/attorney data
- [x] All 8 query parameters work correctly
- [x] Pagination metadata included in response
- [x] Card brand and last4 populated on new successful payments
- [x] Receipt URL stored on successful payments
- [x] Search works across description + case_number + violation_type
- [x] Backward compatible — existing payments with NULL card details still returned
