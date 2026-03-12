# Story AU-3: Client Management Header Button Sizing

**Status:** DONE

## Description
Made the Add Client and Export buttons in Client Management match the search field height:
- Changed `header-actions` from `align-items: center` to `align-items: flex-start` for top alignment
- Hidden `mat-mdc-form-field-subscript-wrapper` on the search field to remove extra bottom gap
- Set `header-actions button` height to 56px (matching Material outline form field height)

## Files Changed
- `frontend/src/app/features/admin/client-management/client-management.component.ts` — header-actions CSS
