# Story AU-2: Recent Cases Alignment Fix

**Status:** DONE

## Description
Fixed misaligned attorney and operator names in the Recent Cases section by:
- Giving `case-info` flex: 1 with min-width: 0
- Giving `case-staff` a fixed width of 180px with flex-shrink: 0
- Giving `case-badges` a fixed width of 160px with flex-shrink: 0
- Changed from `justify-content: space-between` to `gap: 16px` for consistent spacing
- Added text overflow ellipsis on staff labels

## Files Changed
- `frontend/src/app/features/admin/dashboard/admin-dashboard.component.ts` — case-row CSS
