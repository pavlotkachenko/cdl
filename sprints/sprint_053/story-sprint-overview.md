# Sprint 053 — Admin Case Management: Real Data, Operator Assignment & Case Detail

## Goal
Transform the admin dashboard from a **mock-data prototype** into a fully functional command
center. When this sprint is done, an admin can: view real KPI metrics and case queues, open a
rich case detail page (with status pipeline, inline editing, and file management), assign and
reassign cases among operators via a visual Kanban board, navigate between multi-board views,
and change case statuses through the same validated workflow operators use — all backed by real
backend endpoints and covered by comprehensive tests.

## Context & Relationship to Sprints 051 + 052
Sprint 051 built the **operator viewing infrastructure** (case detail, attorney assignment,
messaging, batch OCR, notifications). Sprint 052 added **active management** tools (inline
editing, file manager, status pipeline, Kanban, multi-board navigation). Sprint 053 brings
**admin parity and oversight**: the admin gets access to the same rich case management
capabilities operators have (via component reuse), plus admin-specific features like
cross-operator Kanban assignment and real-time workload visibility.

**Key insight:** Most backend authorization is already in place — operator routes already
accept `authorize(['operator', 'admin'])`. The primary work is: (1) new admin-specific
backend endpoints for dashboard data and operator listings, (2) frontend integration to
replace mocks with real API calls, (3) a proper admin case detail page that reuses sprint 052
components, and (4) an operator-assignment Kanban board.

## Scope
- **Backend:** 5-6 new endpoints (dashboard stats, operator list, chart aggregations,
  workload metrics), 1 new endpoint wiring for assign-operator
- **Frontend:** 3 new components (admin case detail, operator assignment Kanban, multi-board
  tabs), major refactor of admin dashboard to remove mocks, integration of sprint 052
  components into admin context
- **Testing:** Co-located `.spec.ts` for every new component/service, backend Jest tests for
  new endpoints
- **i18n:** ~40 new translation keys across en/es/fr

## Stories

| # | Story | Priority | Status |
|---|-------|----------|--------|
| AC-1 | Backend: admin dashboard endpoints & operator management APIs | P0 | DONE |
| AC-2 | Admin case detail page (reuse StatusPipeline, CaseEditForm, FileManager) | P0 | DONE |
| AC-3 | Replace admin dashboard mock data with real API integration | P0 | DONE |
| AC-4 | Operator assignment Kanban board (columns = operators, drag to assign) | P1 | DONE |
| AC-5 | Admin status workflow integration (validated transitions in case management) | P1 | DONE |
| AC-6 | Admin multi-board navigation (All Cases, By Operator, By Status, Archive) | P1 | DONE |
| AC-7 | i18n, accessibility & comprehensive test coverage | P2 | DONE |

## Critical Discovery: Mock Data in Production Code
The admin dashboard (`admin-dashboard.component.ts`) contains **hardcoded mock arrays**:
- `MOCK_OPERATORS` (3 fake operators), `MOCK_ATTORNEYS` (5 fake attorneys)
- `MOCK_QUEUE` (8 test cases used as fallback)
- `MOCK_VIOLATION_DATA`, `MOCK_ATTORNEY_WORKLOAD` (chart data)
- All `adminService` and `dashboardService` calls fall back to mock data on API error

The case management component calls `PATCH /api/admin/cases/:id/status` which is **not wired
in admin.routes.js**. The frontend service uses `catchError()` → mock fallback, masking the
fact that these endpoints don't exist.

## Backend Authorization Audit
Admin is **already authorized** on most routes needed:

| Route | Auth | Admin Access |
|-------|------|-------------|
| `GET /api/operator/cases` | operator, admin | Yes — but filters by `req.user.id` (returns empty for admin) |
| `GET /api/operator/cases/:caseId` | operator, admin | Yes — admin bypasses assignment check |
| `PATCH /api/operator/cases/:caseId/status` | operator, admin | Yes — admin bypasses assignment check |
| `GET /api/cases/:id/next-statuses` | canAccessCase | Yes — admin passes canAccessCase |
| `GET /api/cases/:id/documents` | driver, operator, admin | Yes |
| `POST /api/cases/:id/documents` | driver, operator, admin | Yes |
| `POST /api/cases/:id/assign-operator` | admin | Yes — admin-only |
| `PATCH /api/cases/:id` | operator, attorney, admin | Yes |

**Gap:** `GET /api/operator/cases` returns only cases assigned to `req.user.id`, which means
admin gets empty results. Need a new admin-specific endpoint to list ALL cases with optional
operator filter.

## Story Dependency Graph
```
AC-1 (backend endpoints) ←─── EVERYTHING depends on this
  │
  ├──▶ AC-2 (case detail page — needs real case data)
  │       │
  │       └──▶ AC-5 (workflow integration — enhances case detail)
  │
  ├──▶ AC-3 (dashboard mock replacement — needs real endpoints)
  │
  ├──▶ AC-4 (operator Kanban — needs operator list + assign endpoint)
  │
  └──▶ AC-6 (multi-board — needs all data sources wired)

AC-7 (polish) ←─── runs after all feature stories
```

## Implementation Order (recommended)
1. **Wave 0 (backend foundation):** AC-1 — must land first, everything depends on real APIs
2. **Wave 1 (core views):** AC-2, AC-3 (parallel — case detail + dashboard integration)
3. **Wave 2 (admin-specific features):** AC-4, AC-5, AC-6 (parallel — Kanban, workflow, multi-board)
4. **Wave 3 (polish):** AC-7

## Files Changed (summary — see individual stories for details)

### Backend (New)
- `controllers/admin.controller.js` — add `getDashboardStats`, `getAllCases`, `getOperators`,
  `getChartData`, `assignOperator`, `updateCaseStatus` handlers
- `routes/admin.routes.js` — wire new endpoints
- `__tests__/admin.controller.test.js` — tests for new handlers

### Backend (Modified)
- `controllers/operator.controller.js` — potentially add admin-aware query for cases listing

### Frontend (New)
- `features/admin/case-detail/admin-case-detail.component.ts` + `.spec.ts`
- `features/admin/operator-kanban/admin-operator-kanban.component.ts` + `.spec.ts`
- `features/admin/multi-board/admin-multi-board.component.ts` + `.spec.ts` (or refactor dashboard)

### Frontend (Modified)
- `features/admin/dashboard/admin-dashboard.component.ts` — remove all mock data, wire real APIs
- `features/admin/case-management/case-management.component.ts` — add StatusWorkflowService
- `features/admin/admin-routing.module.ts` — new routes for case detail, Kanban
- `core/services/admin.service.ts` — new/updated API methods
- `assets/i18n/en.json`, `es.json`, `fr.json` — ~40 new ADMIN.* keys
