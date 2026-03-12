# Story AU-3: Revenue Dashboard Metric Row Split

**Status:** DONE

## Description
Split the single metrics grid into two distinct rows:
- Row 1 (Revenue): Total Revenue, Net Revenue, Pending Revenue, Refunds (4 columns)
- Row 2 (Operational): Transactions, Avg Transaction, Success Rate, MRR, Growth (5 columns)

Added `revenueCards` and `operationalCards` signals populated from `buildMetricCards()`.

## Files Changed
- `frontend/src/app/features/admin/revenue-dashboard/revenue-dashboard.component.ts` — template, CSS, class properties
