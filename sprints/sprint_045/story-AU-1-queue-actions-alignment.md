# Story AU-1: Case Queue Actions Alignment

**Status:** DONE

## Description
Fixed the Case Queue action row in the admin dashboard:
- Widened `.assign-field` from 160px to 190px so "Assign Operator" and "Assign Attorney" labels are fully visible
- Set `.mat-mdc-text-field-wrapper` height to 44px to match button height
- Hidden `.mat-mdc-form-field-subscript-wrapper` to remove extra bottom space from form fields
- Changed `align-items` from `center` to `flex-start` so all controls top-align
- Set `.auto-assign-btn` height to 44px to match dropdown height
- Increased font-size from 0.78rem to 0.82rem for better readability

## Files Changed
- `frontend/src/app/features/admin/dashboard/admin-dashboard.component.ts` — queue-item-actions CSS
