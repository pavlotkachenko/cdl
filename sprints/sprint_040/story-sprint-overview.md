# Sprint 040 — Admin Portal Enhancements: UI, Mock Data, i18n, Missing Pages

## Goal
Enhance the admin portal with improved UI components, rich mock data, full i18n support
across all admin pages, and create missing pages (notifications, documents).

## Stories

| # | ID | Title | Status |
|---|-----|-------|--------|
| 1 | AP-1 | Admin i18n — add translate pipes to all admin components | DONE |
| 2 | AP-2 | Client management — enhanced UI with mock data | DONE |
| 3 | AP-3 | Reports & analytics — 4 report types with visualizations | DONE |
| 4 | AP-4 | Revenue dashboard — enhanced metrics, charts, transactions table | DONE |
| 5 | AP-5 | Admin notifications page | DONE |
| 6 | AP-6 | Admin documents page | DONE |
| 7 | AP-7 | Rename Operator Dashboard to Admin Dashboard | DONE |
| 8 | AP-8 | Admin routing — add notifications and documents routes | DONE |

## Scope
- All admin components use TranslateModule with ADMIN.* keys (194 keys in EN/ES/FR)
- Client management rewritten with 10 mock clients, gradient avatars, status badges, stats row
- Reports component with 4 report types (overview, staff, cases, financial) and CSS visualizations
- Revenue dashboard with 8 metric cards, Chart.js charts, payment method breakdown, transactions table
- New admin notifications page with 10 mock notifications (carrier-like pattern)
- New admin documents page with 12 mock documents and category filters
- Sidebar and operator dashboard renamed to "Admin Dashboard"
- Admin routing updated with /admin/notifications and /admin/documents routes
- Build passes cleanly with no errors
