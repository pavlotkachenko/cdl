# Story 13.1 — Admin Dashboard Rewrite

**Sprint:** 009 — Admin Portal Modernization
**Status:** DONE

## Changes
- Removed: `standalone: true`, constructor injection, `CommonModule`, `RouterModule`, external template, `Math = Math` hack
- Added: `inject()`, `signal()`, `computed()`, `OnPush`, inline template
- `stats`, `recentCases`, `workload`, `loading` are signals
- `revenueChange` is `computed()` from `stats` signal
- Module-level `STATUS_LABELS`, `PRIORITY_LABELS` constant maps

## File
`frontend/src/app/features/admin/dashboard/admin-dashboard.component.ts`
