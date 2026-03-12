# Story AU-1: Case Queue Card Redesign

**Status:** DONE

## Description
Redesigned the admin dashboard case queue from flat rows with dividers to card-style items with:
- Priority color stripe on left border (urgent=red, high=orange, medium=blue, low=gray)
- Header row with case ID, state badge, and priority/status chips
- Body row with driver name and violation type
- Actions row with operator/attorney dropdowns and auto-assign button (now `mat-flat-button`)
- Hover lift effect with subtle shadow

## Files Changed
- `frontend/src/app/features/admin/dashboard/admin-dashboard.component.ts` — queue template + CSS
