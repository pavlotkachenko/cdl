# Story ATT-2: Attorney Cases List Page

**Status:** DONE

## Description
Created a new cases list page with filterable/sortable table, status badges, priority indicators, search, and mock case data.

## Changes
- Tab filters: All Cases, Open, In Progress, Closed
- Search bar for case number, client name, violation type
- Priority filter (High/Medium/Low) and status filter dropdowns
- Sort by: case number, client name, court date, last updated
- 12 mock cases with varied statuses, priorities, violation types
- Status badges with color coding (open=blue, in-progress=amber, review=purple, court-scheduled=indigo, closed=green, won=emerald, lost=red, dismissed=gray, settled=teal)
- Priority badges (high=red, medium=amber, low=green)
- Click-to-view case detail navigation
- Full i18n with ATT.* keys
- OnPush change detection, signals-based state

## Files Changed
- `frontend/src/app/features/attorney/attorney-cases/attorney-cases.component.ts` — new file
