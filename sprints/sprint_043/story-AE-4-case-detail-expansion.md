# Story AE-4: Case Management — Inline Case Detail Expansion

**Status:** DONE

## Description
Replaced the "View" button navigation (which routed to the same list component) with an inline expandable detail panel. Clicking "View" now toggles a detail grid showing case number, client info, violation type, location, fine amount, court date, description, and tags.

Also added operator name display alongside attorney name in the case list.

## Changes
- Added `expandedCaseId` signal and `toggleDetail()` method
- Added `formatCurrency()` and `formatDate()` helper methods
- Added detail-grid template with all case fields
- Added staff-tag display for attorney and operator names
- Added CSS for detail-panel, detail-grid, tag-chip styles

## Files Changed
- `frontend/src/app/features/admin/case-management/case-management.component.ts`
