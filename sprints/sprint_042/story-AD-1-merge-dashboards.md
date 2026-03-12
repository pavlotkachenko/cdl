# Story AD-1: Merge Operator Dashboard into Admin Dashboard

**Status:** DONE

## Description
Combined the Operator Dashboard (charts, case queue, auto-assign) with the Admin Dashboard (KPI stats, recent cases, staff workload) into a single unified dashboard at `/admin/dashboard`.

## Changes
- Rewrote admin-dashboard.component.ts to include content from both dashboards
- 8 KPI stat cards: Total Cases, Active Cases, Pending Cases, Resolved Cases, Success Rate, Revenue This Month, Avg Resolution Time, Cases This Week
- 3 Chart.js charts: Case Status Distribution (doughnut), Violation Types (bar), Attorney Workload (horizontal bar)
- Case queue section with search, status filter, priority filter, clear button, auto-assign per case
- Recent cases section with status/priority badges and "View All" button
- Staff workload section with utilization bars (green/amber/red)
- Mock data fallbacks for case queue (8 items), violation types, attorney workload
- Uses both AdminService and DashboardService
- Full i18n with ADMIN.* translation keys
- Renamed ADMIN.DASHBOARD from "Admin Dashboard" to "Dashboard" in en/es/fr.json

## Files Changed
- `frontend/src/app/features/admin/dashboard/admin-dashboard.component.ts` — full rewrite
- `frontend/src/assets/i18n/en.json` — updated ADMIN.DASHBOARD label
- `frontend/src/assets/i18n/es.json` — updated ADMIN.DASHBOARD label
- `frontend/src/assets/i18n/fr.json` — updated ADMIN.DASHBOARD label
