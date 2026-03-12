# Story AP-4: Revenue Dashboard — Enhanced Metrics, Charts, Transactions Table

**Status:** DONE

## Description
Enhanced the revenue dashboard with 8 metric cards, Chart.js charts, payment method
breakdown visualization, recent transactions table, and rich mock data fallbacks.

## Changes
- 8 metric cards: Total Revenue, Net Revenue, Refunds, Transactions, Avg Transaction, Success Rate, MRR, Growth
- Each card has gradient icon background, trend indicator (up/down arrow with percentage)
- Chart.js charts: revenue over time (line), payment methods (doughnut), top attorneys (horizontal bar)
- Payment methods breakdown with horizontal progress bars and percentages
- Recent transactions table with status badges (completed/pending/refunded/failed)
- Date range picker with Apply button for filtering
- CSV export functionality
- Mock data fallback via `catchError(() => of(MOCK_...))` for all API calls
- 30 daily revenue data points, 4 payment methods, 8 attorneys, 10 transactions
- Responsive breakpoints at 1200px, 768px, 480px
- Full i18n with ADMIN.* translation keys

## Files Changed
- `frontend/src/app/features/admin/revenue-dashboard/revenue-dashboard.component.ts` — full rewrite
