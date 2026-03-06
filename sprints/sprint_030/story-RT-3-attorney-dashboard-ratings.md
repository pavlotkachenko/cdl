# Story RT-3 — Attorney Dashboard Rating Display

**Sprint:** 030 — Rating System + Invoicing
**Status:** DONE

## User Story

As James (attorney),
I want to see my average star rating and total review count on my dashboard,
so I know how drivers perceive my performance.

## Changes

### `frontend/src/app/core/services/attorney.service.ts` — UPDATED

New method:
- `getMyRatings(): Observable<{ averageScore: number, reviewCount: number }>` — calls `GET /api/ratings/me`

### `frontend/src/app/features/attorney/attorney-dashboard/attorney-dashboard.component.ts` — UPDATED

New signals:
- `averageScore = signal(0)`
- `reviewCount = signal(0)`

`ngOnInit` now also calls `loadRatings()` which populates both signals.

Template addition: rating summary card showing star icons filled to `averageScore` (rounded) and `(N reviews)` count.

## Acceptance Criteria

- [x] Dashboard shows average score and review count on load
- [x] Shows "No reviews yet" when `reviewCount === 0`
- [x] Star display rounds to nearest half-star

## Test Coverage Matrix

| Source File | Test File | Status |
|---|---|---|
| `attorney-dashboard.component.ts` | `attorney-dashboard.component.spec.ts` | ✅ +4 tests |
| `attorney.service.ts` | existing `attorney.service.spec.ts` | ✅ |
