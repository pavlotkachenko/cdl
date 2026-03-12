# Story AE-1: Dashboard Stat Cards — 2-Row Layout

**Status:** DONE

## Description
Reorganized the 8 KPI stat cards into two distinct rows:
- **Row 1 (Cases):** Total Cases, Active, Pending, Resolved, Cases This Week
- **Row 2 (Revenue & Metrics):** Revenue Month, Pending Revenue, Success Rate, Avg Resolution, Total Clients

Added a new "Pending Revenue" computed signal that estimates pending revenue based on pending case count.

## Files Changed
- `frontend/src/app/features/admin/dashboard/admin-dashboard.component.ts` — split stat-grid into 2 rows, added pendingRevenue computed signal
