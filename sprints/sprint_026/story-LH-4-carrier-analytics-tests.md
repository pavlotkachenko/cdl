# Story LH-4 — Carrier Analytics Tests Expansion

**Sprint:** 026 — Launch Hardening
**Status:** DONE

## Scope

Expand `carrier-analytics.component.spec.ts` to cover the new empty states added in LH-3 and the existing untested edge cases (CA-5 from Sprint 021 was TODO).

## Changes

### `frontend/src/app/features/carrier/carrier-analytics/carrier-analytics.component.spec.ts` — EXPANDED

Added 11 new tests (total: 22, was 11):

| Test | Coverage |
|---|---|
| zero-data state renders when `totalCases === 0` | LH-3 empty state |
| chart sections show empty icon when data is absent | LH-3 chart empties |
| bar height edge case — 0% when all values are zero | edge case |
| bar height edge case — 100% for single-value dataset | edge case |
| export button shows loading spinner while exporting | export state |
| export button re-enables after export completes | export state |
| export button re-enables after export error | export error state |
| loading skeleton shown while `loading()` is true | loading state |
| error state shown when analytics call fails | error state |
| error state hidden after successful reload | error recovery |
| component creates without errors | creation |

## Test Coverage Matrix

| Source File | Test File | Status |
|---|---|---|
| `carrier-analytics.component.ts` | `carrier-analytics.component.spec.ts` | ✅ 22 tests |
