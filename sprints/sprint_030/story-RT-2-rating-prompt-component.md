# Story RT-2 — Rating Prompt Component (Driver)

**Sprint:** 030 — Rating System + Invoicing
**Status:** DONE

## User Story

As Miguel (driver),
I want a 5-star prompt to appear automatically after my case is resolved,
so rating my attorney is effortless and I don't forget.

## Changes

### `frontend/src/app/features/driver/rating-prompt/rating-prompt.component.ts` — CREATED

- 5-star interactive rating widget (mat-icon stars, click to select)
- Optional comment textarea
- Signals: `selectedScore = signal(0)`, `comment = signal('')`, `submitting = signal(false)`
- `submitRating()` — calls `POST /api/ratings`, shows snackBar on success/error
- `input()`: `caseId: string`, `attorneyName: string`
- `output()`: `rated` event emitted on successful submission
- Shown only when `case.status === 'resolved'` and no existing rating for the case

### Integration

Embedded in `case-detail.component.ts` — shown conditionally when case is resolved and driver hasn't rated yet.

## Acceptance Criteria

- [x] 5-star selector renders and responds to click
- [x] Submit button disabled when `selectedScore === 0`
- [x] Successful submission emits `rated` output and hides prompt
- [x] Error shows snackBar, submit button re-enabled
- [x] Component not shown if driver already rated the case

## Test Coverage Matrix

| Source File | Test File | Status |
|---|---|---|
| `rating-prompt.component.ts` | `rating-prompt.component.spec.ts` | ✅ |
