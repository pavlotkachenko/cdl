# Story CM-1: Carrier Service Mock Data Fallbacks

**Status:** DONE

## Description
All CarrierService API methods now return realistic mock data when the backend API is
unavailable, ensuring the carrier portal UI is always populated and demonstrable.

## Acceptance Criteria
- [x] `getStats()` returns mock fleet stats (24 drivers, 7 active, 3 pending, 48 resolved)
- [x] `getDrivers()` returns 8 mock drivers with CDL numbers and open case counts
- [x] `getCases()` returns 10 mock cases across all statuses with attorney assignments
- [x] `getCsaScore()` returns mock CSA score (42, medium risk, 7 open violations)
- [x] `getAnalytics()` returns mock analytics (58 cases, 82% success, 6 months of data)
- [x] `getProfile()` returns mock carrier profile (Pacific Coast Logistics)
- [x] `getPayments()` returns 7 mock payments (paid, pending, failed)
- [x] `getNotifications()` returns 8 mock notifications (mix of types, read/unread)
- [x] `addDriver()`, `removeDriver()`, `bulkArchive()` all have mock fallbacks
- [x] All fallbacks use `catchError(() => of(mockData))` — real API calls attempted first

## Files Changed
- `frontend/src/app/core/services/carrier.service.ts` — added mock data constants, catchError fallbacks, new payment/notification interfaces and methods
