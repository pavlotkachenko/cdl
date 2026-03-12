# Story AU-1: Center Assign Operator/Attorney Dropdown Labels

**Status:** DONE

## Description
Centered the label text ("Assign Operator", "Assign Attorney") inside the Case Queue dropdowns while keeping selected values left-aligned:
- Added `text-align: center` to `.assign-field ::ng-deep .mat-mdc-form-field-infix`
- Added `text-align: left` to `.assign-field ::ng-deep .mat-mdc-select-value-text`

## Files Changed
- `frontend/src/app/features/admin/dashboard/admin-dashboard.component.ts` — assign-field CSS
