# Story NH-CS-3 — Tests

**Sprint:** 033 — Notification Hygiene + CSA Score
**Priority:** P1
**Status:** DONE

## Backend Tests

### `backend/src/__tests__/notification.utils.test.js` — CREATED
- `isQuietHours` returns true when time is between 21:00 and 08:00
- `isQuietHours` returns false at noon
- `isQuietHours` handles midnight boundary correctly (23:59 → true)
- `isQuietHours` handles custom preferences (e.g., 22:00–07:00)
- `isQuietHours` returns false when user has no preferences (uses defaults)

### `backend/src/__tests__/sms.service.test.js` — UPDATED (+2 tests)
- SMS not sent when `isQuietHours` returns true
- SMS sent normally when `isQuietHours` returns false

### `backend/src/__tests__/onesignal.service.test.js` — UPDATED (+2 tests)
- Push skipped when `isQuietHours` returns true
- Push sent normally when `isQuietHours` returns false

### `backend/src/__tests__/carrier.csa.test.js` — CREATED
- Returns score 0 when no open cases
- Weights HOS violations higher than speeding
- Returns `riskLevel: 'low'` for score < 34
- Returns `riskLevel: 'medium'` for score 34–66
- Returns `riskLevel: 'high'` for score 67+
- Returns 403 for non-carrier roles

## Frontend Tests

### `frontend/src/app/features/carrier/dashboard/carrier-dashboard.component.spec.ts` — UPDATED (+3 tests)
- CSA score widget renders with score from API
- Green color class applied when score < 34
- Red color class applied when score ≥ 67

## Totals (estimated)

- Backend: ~14 new tests
- Frontend: ~3 new tests
