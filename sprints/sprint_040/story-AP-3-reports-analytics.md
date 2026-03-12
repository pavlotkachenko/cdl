# Story AP-3: Reports & Analytics — 4 Report Types with Visualizations

**Status:** DONE

## Description
Rewrote the reports component with 4 distinct report types (overview, staff performance,
case analytics, financial), each with CSS-based visualizations and rich mock data.

## Changes
- Report type selector: Overview, Staff Performance, Case Analytics, Financial
- Overview: KPI cards with trend indicators, cases-by-status bars, monthly trend table
- Staff Performance: per-staff cards with success rate, resolution time, satisfaction, case breakdown
- Case Analytics: status distribution, violation type bars, priority breakdown, monthly trends
- Financial: revenue/outstanding/collected/avg-case-value stats, monthly revenue table
- All visualizations use pure CSS (progress bars, colored badges) — no Chart.js dependency
- Mock data: 6 staff members, 6 case statuses, 8 violation types, 12 months of trends
- Staff member filter dropdown for performance report
- Full i18n with ADMIN.* translation keys

## Files Changed
- `frontend/src/app/features/admin/reports/reports.component.ts` — full rewrite
