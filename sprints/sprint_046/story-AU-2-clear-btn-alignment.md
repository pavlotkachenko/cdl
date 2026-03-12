# Story AU-2: Case Queue Clear Button Height Alignment

**Status:** DONE

## Description
Made the Case Queue filter bar's Clear button match the height of the Status/Priority dropdowns:
- Changed `queue-filters` from `align-items: center` to `align-items: flex-start` for top alignment
- Hidden `mat-mdc-form-field-subscript-wrapper` on filter fields to remove extra bottom gap
- Set `.clear-btn` height to 56px (matching Material outline form field height)

## Files Changed
- `frontend/src/app/features/admin/dashboard/admin-dashboard.component.ts` — queue-filters + clear-btn CSS
