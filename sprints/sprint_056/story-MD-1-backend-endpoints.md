# MD-1: Backend: audit and create missing API endpoints for all mock data sources

**Status:** TODO
**Priority:** P0
**Dependencies:** None (all other stories depend on this)

## Description
Audit every mock data instance and map it to an existing or new backend endpoint. Create any missing endpoints needed to serve real data for all frontend components. This is the foundation story -- no frontend migration can proceed until the corresponding backend endpoints exist and return the correct data shapes.

## Acceptance Criteria

- [ ] Audit complete: every MOCK_ constant mapped to a specific API endpoint
- [ ] Attorney endpoints exist: GET /api/attorney/cases (with filters), GET /api/attorney/clients, GET /api/attorney/reports/performance, GET /api/attorney/notifications
- [ ] Admin revenue endpoints exist: GET /api/admin/revenue/metrics, GET /api/admin/revenue/daily, GET /api/admin/revenue/by-method, GET /api/admin/revenue/by-attorney, GET /api/admin/revenue/recent-transactions
- [ ] Admin reports endpoints exist: GET /api/admin/reports/overview, GET /api/admin/reports/staff-performance
- [ ] Admin client management endpoint exists: GET /api/admin/clients (with search, pagination)
- [ ] Operator dashboard endpoint returns real assigned + unassigned cases with KPI summary
- [ ] Carrier documents endpoint exists: GET /api/carrier/documents
- [ ] All new endpoints have proper authorization middleware
- [ ] All new endpoints have Jest tests in backend/src/__tests__/
- [ ] All endpoints return data shapes matching what frontend components expect

## Files

- `backend/src/controllers/attorney.controller.js`
- `backend/src/controllers/admin.controller.js`
- `backend/src/controllers/operator.controller.js`
- `backend/src/controllers/carrier.controller.js`
- `backend/src/routes/attorney.routes.js`
- `backend/src/routes/admin.routes.js`
- `backend/src/routes/operator.routes.js`
- `backend/src/routes/carrier.routes.js`
- `backend/src/services/revenue.service.js` (new)
- `backend/src/services/report.service.js` (new)
- `backend/src/__tests__/attorney.controller.test.js`
- `backend/src/__tests__/admin-revenue.controller.test.js` (new)
- `backend/src/__tests__/admin-reports.controller.test.js` (new)

## Technical Notes

- Revenue metrics should aggregate from the `payments` table via Stripe data
- Attorney performance reports should query `cases` table with joins to `users`
- Client management endpoint must support search (name, email, CDL number) and pagination (offset/limit)
- Operator KPI summary should be computed from real case counts grouped by status
- All endpoints must enforce role-based access via existing auth middleware
- Data shapes must match the interfaces/types already used in frontend components
