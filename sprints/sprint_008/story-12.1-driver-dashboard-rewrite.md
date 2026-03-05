# Story 12.1 — Driver Dashboard Rewrite

**Sprint:** 008 — Driver Experience Modernization
**Status:** DONE

## Goal
Rewrite `driver-dashboard.component.ts` to Angular 21 standards.

## Changes
- Removed: `standalone: true`, `NgZone`, `ChangeDetectorRef`, 40+ `console.log` calls, `Subject`/`takeUntil`, external template, `CommonModule`, `RouterModule`
- Added: `signal()`, `computed()`, `OnPush`, inline template
- `cases`, `loading`, `error`, `currentUser` are signals
- `recentCases` and `stats` are `computed()` from `cases` signal
- `STATUS_LABELS` and `STATUS_CLASSES` are module-level constant maps

## File
`frontend/src/app/features/driver/dashboard/driver-dashboard.component.ts`
