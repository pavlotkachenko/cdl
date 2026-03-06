# Story RT-IN-4 — Tests

**Sprint:** 030 — Rating System + Invoicing
**Status:** DONE

## Scope

12 new backend tests (rating service) + 12 new frontend tests across rating prompt, case invoice, and attorney dashboard.

## Backend Tests

### `backend/src/__tests__/rating.service.test.js` — CREATED (12 tests)

| Test | Coverage |
|---|---|
| `submitRating` happy path — inserts rating and returns result | RT-1 |
| `submitRating` score < 1 returns validation error | RT-1 |
| `submitRating` score > 5 returns validation error | RT-1 |
| `submitRating` duplicate (same case + driver) returns 409 | RT-1 |
| `submitRating` DB error propagates correctly | RT-1 |
| `getAttorneyRatings` returns average and count | RT-1 |
| `getAttorneyRatings` returns 0 average when no ratings | RT-1 |
| `getMyRating` returns attorney's own aggregate | RT-1 |
| `getMyRating` returns 0 count when no reviews | RT-1 |
| `getInvoiceForCase` returns correct invoice structure | IN-1 |
| `getInvoiceForCase` returns 403 for non-participant | IN-1 |
| `getInvoiceForCase` returns 404 for missing case | IN-1 |

## Frontend Tests

### `rating-prompt.component.spec.ts` — CREATED (~5 tests)
- Component creates without errors
- Star click sets `selectedScore` signal
- Submit disabled when `selectedScore === 0`
- `submitRating()` calls POST and emits `rated` on success
- Error shows snackBar, `submitting` cleared

### `case-invoice-section.component.spec.ts` — CREATED (~5 tests)
- Component creates without errors
- Invoice data renders after successful load
- Loading skeleton shown while `loading()` is true
- Error state shown when API fails
- `printInvoice()` calls `window.print()`

### `attorney-dashboard.component.spec.ts` — UPDATED (+4 tests)
- `loadRatings()` called on init
- Average score signal populated from API response
- "No reviews yet" shown when `reviewCount === 0`
- Star display reflects `averageScore`

## Test Coverage Matrix

| Source File | Test File | Status |
|---|---|---|
| `rating.service.js` | `rating.service.test.js` | ✅ 12 tests |
| `rating-prompt.component.ts` | `rating-prompt.component.spec.ts` | ✅ |
| `case-invoice-section.component.ts` | `case-invoice-section.component.spec.ts` | ✅ |
| `attorney-dashboard.component.ts` | `attorney-dashboard.component.spec.ts` | ✅ +4 tests |

## Totals

- Backend: 270/270 pass (+12 new)
- Frontend: 593/593 pass (+12 new)
