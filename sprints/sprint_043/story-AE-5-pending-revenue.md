# Story AE-5: Revenue Dashboard — Pending Revenue Indicator

**Status:** DONE

## Description
Added a "Pending Revenue" metric card to the revenue dashboard, positioned after Net Revenue and before Refunds. Estimates pending revenue as 18% of total revenue (cases awaiting payment). Uses orange color class to visually distinguish from collected revenue.

## Files Changed
- `frontend/src/app/features/admin/revenue-dashboard/revenue-dashboard.component.ts` — added PENDING_REVENUE card in buildMetricCards()
