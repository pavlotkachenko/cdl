# Story AE-3: Recent Cases — Show Attorney and Operator Names

**Status:** DONE

## Description
Added attorney (gavel icon) and operator (support_agent icon) names to each recent case row in the dashboard. Names display between the case info and status badges columns.

## Files Changed
- `frontend/src/app/features/admin/dashboard/admin-dashboard.component.ts` — added case-staff column with conditional attorney/operator name display
