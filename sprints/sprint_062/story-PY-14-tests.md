# Story PY-14 — Tests: Full Coverage for All Changes

## Status: DONE

## Description
Write comprehensive tests for all backend and frontend changes in this sprint.

## Backend Tests

### `backend/src/__tests__/payment.service.test.js` (update)
- Test `getUserPayments()` with all filter combinations (date range, status, amount range, search, pagination, sorting)
- Test `getUserPaymentStats()` returns correct aggregates for a user
- Test `retryPayment()`:
  - Success: failed payment creates new intent
  - Error: non-failed payment returns error
  - Error: unauthorized user
  - Error: existing pending payment for same case (409)
  - Error: cooldown not expired
- Test that `confirmPayment()` stores `card_brand`, `card_last4`, `receipt_url`
- Test `getUserPayments()` with Supabase joins (case + attorney data)

### `backend/src/__tests__/payment.controller.test.js` (update)
- Test `GET /user/me` with query parameters parsed correctly
- Test `GET /user/me/stats` returns correct shape
- Test `POST /:id/retry` authorization and validation
- Test pagination metadata in response

## Frontend Tests

### `frontend/src/app/features/shared/payment/payment-history/payment-history.component.spec.ts` (rewrite)

**Unit tests:**
- Component creation with OnPush change detection
- KPI cards render with correct values from stats signal
- KPI cards show skeleton during loading
- Filter form initialization with defaults
- Apply filters calls API with correct params
- Reset filters clears form and reloads
- Active filter chips computed correctly
- Removing a chip resets that filter
- Custom sort toggle (asc/desc) works
- Pagination signal updates trigger data fetch
- Page info computed signal returns correct range text
- Empty state shown when payments signal is empty array
- Error state shown on API failure
- Receipt download triggers blob download
- Retry button calls retry endpoint
- CSV export generates correct file content
- Status label mapping (succeeded → Paid)
- Card brand display mapping (visa → VISA)
- Amount color class computed correctly per status
- Transaction type emoji computed from description/status

**Integration tests:**
- Full data flow: load stats + load payments → render KPI + table
- Filter → apply → verify API call params → verify table update
- Pagination → page change → verify API call → verify table
- Sort → click header → verify API call with sort params

## Test Helpers
```typescript
const mockPayment: PaymentTransaction = {
  id: 'pay-1',
  user_id: 'user-1',
  amount: 450.00,
  currency: 'USD',
  status: 'succeeded',
  description: 'Attorney Fee — CASE-2026-000058',
  card_brand: 'visa',
  card_last4: '4242',
  receipt_url: 'https://receipt.stripe.com/xxx',
  created_at: '2026-03-14T09:42:00Z',
  paid_at: '2026-03-14T09:42:05Z',
  case: { id: 'case-1', case_number: 'CASE-2026-000058', violation_type: 'speeding', location: 'I-35 Texas' },
  attorney: { name: 'James Mitchell' }
};

const mockStats: PaymentStats = {
  total_amount: 1145.00,
  paid_amount: 650.00,
  pending_amount: 120.00,
  failed_amount: 375.00,
  refunded_amount: 200.00,
  transaction_count: 4,
  paid_count: 2,
  pending_count: 1,
  failed_count: 1,
  refunded_count: 0,
  currency: 'USD'
};
```

## Acceptance Criteria
- [x] Backend: getUserPayments filter tests pass
- [x] Backend: getUserPaymentStats tests pass
- [x] Backend: retryPayment tests pass (success + all error cases)
- [x] Backend: card details storage on confirmation tested
- [x] Frontend: component creation test passes with OnPush
- [x] Frontend: KPI card rendering tests pass
- [x] Frontend: filter + chip tests pass
- [x] Frontend: pagination tests pass
- [x] Frontend: sort tests pass
- [x] Frontend: empty/error state tests pass
- [x] Frontend: row action tests pass
- [x] Frontend: CSV export tests pass
- [x] All existing payment tests still pass
