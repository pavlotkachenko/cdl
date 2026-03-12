# Story AE-2: Case Queue — Assign Operator and Attorney

**Status:** DONE

## Description
Added operator and attorney assignment dropdowns to each case queue row, alongside the existing Auto-Assign button. Each dropdown triggers an API call to assign the selected staff member and updates the local queue status.

## Changes
- Added MOCK_OPERATORS and MOCK_ATTORNEYS lists
- Added `operators` and `attorneys` class properties
- Added `assignOperator()` and `assignAttorney()` methods
- Added `assign-controls` layout with two mat-select fields per queue row
- Added CSS for compact assign-field styling

## Files Changed
- `frontend/src/app/features/admin/dashboard/admin-dashboard.component.ts`
