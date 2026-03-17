# MD-4: Admin: migrate dashboard, revenue, reports, client management, notifications, documents to live API data

**Status:** TODO
**Priority:** P0
**Dependencies:** MD-1

## Description
Replace ALL mock data across 6 admin component files. The revenue dashboard is the most complex -- it has 5 separate mock data sources (metrics, daily revenue, payment methods, attorney performance, recent transactions) that each need a dedicated API endpoint. The client management component contains fake PII (emails, phone numbers, CDL numbers, addresses) that must be removed from production code.

## Acceptance Criteria

- [ ] admin-dashboard.component.ts: all mock fallback patterns removed -- dashboard loads from GET /api/admin/dashboard/stats
- [ ] revenue-dashboard.component.ts: generateMockDailyRevenue() removed -- daily data from GET /api/admin/revenue/daily
- [ ] revenue-dashboard.component.ts: MOCK_METRICS removed -- metrics from GET /api/admin/revenue/metrics
- [ ] revenue-dashboard.component.ts: MOCK_METHODS removed -- payment method breakdown from GET /api/admin/revenue/by-method
- [ ] revenue-dashboard.component.ts: MOCK_ATTORNEYS removed -- attorney revenue from GET /api/admin/revenue/by-attorney
- [ ] revenue-dashboard.component.ts: MOCK_RECENT_TRANSACTIONS removed -- from GET /api/admin/revenue/recent-transactions
- [ ] revenue-dashboard.component.ts: MOCK_GROWTH removed -- calculated from real revenue data
- [ ] reports.component.ts: MOCK_OVERVIEW_KPIS, MOCK_STAFF removed -- from GET /api/admin/reports/overview and /staff-performance
- [ ] client-management.component.ts: MOCK_CLIENTS (4 clients with fake PII) removed -- from GET /api/admin/clients
- [ ] admin-notifications.component.ts: mock data removed -- from GET /api/notifications
- [ ] admin-documents.component.ts: mock data removed -- from GET /api/admin/documents
- [ ] All components show SkeletonLoader during loading
- [ ] All components show proper empty states
- [ ] No fake financial data ($156,400 revenue, $48,500 MRR, etc.) in production code
- [ ] No fake client PII (marcus.johnson@gmail.com, CDL-IL-884210, etc.) in production code
- [ ] Co-located spec files updated

## Files

- `frontend/src/app/features/admin/dashboard/admin-dashboard.component.ts`
- `frontend/src/app/features/admin/dashboard/admin-dashboard.component.spec.ts`
- `frontend/src/app/features/admin/revenue-dashboard/revenue-dashboard.component.ts`
- `frontend/src/app/features/admin/revenue-dashboard/revenue-dashboard.component.spec.ts`
- `frontend/src/app/features/admin/reports/reports.component.ts`
- `frontend/src/app/features/admin/reports/reports.component.spec.ts`
- `frontend/src/app/features/admin/client-management/client-management.component.ts`
- `frontend/src/app/features/admin/client-management/client-management.component.spec.ts`
- `frontend/src/app/features/admin/notifications/admin-notifications.component.ts`
- `frontend/src/app/features/admin/notifications/admin-notifications.component.spec.ts`
- `frontend/src/app/features/admin/documents/admin-documents.component.ts`
- `frontend/src/app/features/admin/documents/admin-documents.component.spec.ts`

## Technical Notes

- The revenue dashboard is the most data-intensive component: 5 separate data sources, each requiring its own API call
- generateMockDailyRevenue() creates fake daily data points -- replace with real aggregated payment data
- The revenue service (new in MD-1) should aggregate from the `payments` table, grouping by date, method, and attorney
- Client management has full PII mock data (names, emails, phones, CDL numbers, addresses for 4 fake clients) -- security-sensitive removal
- Admin dashboard may have catchError() patterns that fall back to mock data -- these must be converted to error state display
- Revenue growth metrics should be computed server-side by comparing current period to previous period
