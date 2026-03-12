# Story ATT-6: Attorney Reports & Analytics Page

**Status:** DONE

## Description
Created a reports and analytics page with case performance metrics, revenue charts, case distribution visualizations, and monthly performance trends.

## Changes
- KPI cards: Total Cases Handled, Success Rate, Avg Case Duration, Revenue This Month, Revenue This Year
- Cases by type horizontal bar chart (speeding, overweight, logbook, etc.)
- Cases by status doughnut/pie visualization
- Monthly performance trend line chart (12 months)
- Top violation types breakdown with progress bars
- Date range picker for filtering
- Export CSV and Export PDF buttons
- Full i18n with ATT.* keys
- OnPush change detection, signals-based state

## Files Changed
- `frontend/src/app/features/attorney/attorney-reports/attorney-reports.component.ts` — new file
