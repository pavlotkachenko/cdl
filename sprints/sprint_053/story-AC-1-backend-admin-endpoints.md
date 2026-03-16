# Story AC-1: Backend Admin Dashboard Endpoints & Operator Management APIs

## Status: DONE

## Priority: P0

## Depends On: None (foundation story)

## Description
The admin frontend currently relies on hardcoded mock data and calls endpoints that don't
exist. This story creates the backend endpoints the admin dashboard, case management, and
operator assignment features need. Every subsequent story in this sprint depends on AC-1.

## Current State Analysis

### Endpoints That Exist
- `GET /api/admin/users` — user management (works)
- `POST /api/admin/users/invite` — invite users (works)
- `PATCH /api/admin/users/:id/role|suspend|unsuspend` — user admin (works)
- `GET|POST /api/admin/assignment-requests/*` — OC-7 approval flow (works)
- `POST /api/cases/:id/assign-operator` — exists in `case.routes.js` (admin-only, works)

### Endpoints the Frontend Calls But Don't Exist
| Frontend Call | Expected Route | Status |
|---|---|---|
| `adminService.getDashboardStats()` | `GET /api/admin/dashboard/stats` | NOT WIRED |
| `adminService.getAllCases()` | `GET /api/admin/cases` | NOT WIRED |
| `adminService.updateCaseStatus()` | `PATCH /api/admin/cases/:id/status` | NOT WIRED |
| `adminService.getWorkloadDistribution()` | `GET /api/admin/workload` | NOT WIRED |
| `dashboardService.getCaseQueue()` | `GET /api/dashboard/queue` | NOT WIRED |
| `dashboardService.getViolationTypeDistribution()` | `GET /api/dashboard/violation-distribution` | NOT WIRED |
| `dashboardService.getAttorneyWorkloadDistribution()` | `GET /api/dashboard/attorney-workload` | NOT WIRED |

### Endpoints Needed But Not Called Yet
| Purpose | Proposed Route | Consumers |
|---|---|---|
| List all operators with caseloads | `GET /api/admin/operators` | AC-3 (dashboard), AC-4 (Kanban) |
| List all cases (admin-wide, with filters) | `GET /api/admin/cases` | AC-2, AC-3, AC-6 |
| Get single case detail (admin) | `GET /api/admin/cases/:id` | AC-2 (case detail page) |

## Implementation

### 1. New Admin Endpoints to Add to `admin.controller.js`

#### `getDashboardStats`
```
GET /api/admin/dashboard/stats
Auth: admin
Response: {
  totalCases: number,
  activeCases: number,
  pendingCases: number,
  resolvedCases: number,
  closedCases: number,
  casesThisWeek: number,
  totalClients: number,
  totalOperators: number,
  totalAttorneys: number,
  avgResolutionDays: number
}
```
**Implementation:** Aggregate queries on `cases` table grouped by status, count distinct
`driver_id` for clients, count users by role for staff metrics. Use `created_at >= now() - 7d`
for weekly count.

#### `getAllCases`
```
GET /api/admin/cases?status=X&priority=X&operator_id=X&attorney_id=X&search=X&limit=50&offset=0
Auth: admin
Response: {
  cases: Array<{
    id, case_number, status, priority, violation_type, violation_date,
    state, county, customer_name, customer_email,
    assigned_operator_id, operator_name,
    assigned_attorney_id, attorney_name,
    created_at, updated_at, ageHours
  }>,
  total: number
}
```
**Implementation:** Query `cases` table with LEFT JOINs on `users` for operator/attorney
names. Support filters: `status` (eq), `priority` (eq), `operator_id` (eq, including
`is.null` for unassigned), `attorney_id` (eq), `search` (ilike on case_number,
customer_name, customer_email). Paginate with `limit`/`offset`. Compute `ageHours` as
`EXTRACT(EPOCH FROM now() - created_at) / 3600`.

#### `getAdminCaseDetail`
```
GET /api/admin/cases/:id
Auth: admin
Response: {
  case: { ...full case object with all fields },
  activity: Array<{ id, action, details, created_at, user_name }>,
  operator_name: string | null,
  attorney_name: string | null
}
```
**Implementation:** Fetch case by ID (no assignment check — admin sees all), join activity
log with user names, include operator/attorney names. This is similar to
`operator.controller.getCaseDetail()` but without the `assigned_operator_id` check.

#### `getOperators`
```
GET /api/admin/operators
Auth: admin
Response: {
  operators: Array<{
    id, name, email, is_active,
    activeCaseCount: number,
    totalCaseCount: number,
    avgAgeHours: number
  }>
}
```
**Implementation:** Query `users` where `role = 'operator'` and `is_active = true`. For each
operator, count cases from `cases` table where `assigned_operator_id = operator.id` grouped
by status (active vs total). Compute average age of active cases.

#### `updateCaseStatus`
```
PATCH /api/admin/cases/:id/status
Auth: admin
Body: { status: string, comment?: string }
Response: { case: { ...updated case } }
```
**Implementation:** Use `statusWorkflowService.validateTransition()` to validate the
transition. If valid, update case status, create activity log entry with `admin` actor and
optional comment. Notify driver if status is customer-visible. If the admin needs to
force-override (e.g., reopen a closed case), add an `override: true` flag that bypasses
workflow validation — log this as "admin override" in the activity log.

#### `getChartData`
```
GET /api/admin/charts/:type
Auth: admin
Types: 'violation-distribution', 'attorney-workload', 'status-distribution'
Response: { labels: string[], data: number[] }
```
**Implementation:**
- `violation-distribution`: `SELECT violation_type, COUNT(*) FROM cases GROUP BY violation_type`
- `attorney-workload`: `SELECT u.full_name, COUNT(c.id) FROM cases c JOIN users u ON c.assigned_attorney_id = u.id WHERE c.status NOT IN ('closed','resolved') GROUP BY u.full_name`
- `status-distribution`: `SELECT status, COUNT(*) FROM cases GROUP BY status`

#### `getWorkloadDistribution`
```
GET /api/admin/workload
Auth: admin
Response: {
  staff: Array<{
    id, name, role, activeCases: number,
    capacity: number, utilization: number
  }>
}
```
**Implementation:** Query operators and attorneys with their active case counts. Define
capacity thresholds (e.g., operator: 20 cases, attorney: 15 cases). Compute utilization
percentage.

### 2. Route Wiring in `admin.routes.js`

Add to existing route file:
```javascript
// Dashboard
router.get('/dashboard/stats', adminController.getDashboardStats);
router.get('/workload', adminController.getWorkloadDistribution);
router.get('/charts/:type', adminController.getChartData);

// Cases (admin-wide)
router.get('/cases', adminController.getAllCases);
router.get('/cases/:id', adminController.getAdminCaseDetail);
router.patch('/cases/:id/status', adminController.updateCaseStatus);

// Operators
router.get('/operators', adminController.getOperators);
```

All routes inherit the existing `authenticate` + `authorize('admin')` middleware already
applied to the router.

### 3. Backend Tests

Create or update `backend/src/__tests__/admin.controller.test.js`:

**getDashboardStats tests:**
- Returns correct aggregate counts from cases table
- Returns zero counts when no cases exist
- Returns 500 on database error

**getAllCases tests:**
- Returns all cases with operator/attorney names joined
- Filters by status correctly
- Filters by operator_id correctly (including null for unassigned)
- Search filters by case_number, customer_name, customer_email
- Paginates with limit/offset
- Returns total count for pagination
- Returns 500 on database error

**getAdminCaseDetail tests:**
- Returns full case with activity log and staff names
- Returns 404 for non-existent case
- Returns 500 on database error

**getOperators tests:**
- Returns operators with active case counts
- Excludes inactive operators
- Returns empty array when no operators exist
- Returns 500 on database error

**updateCaseStatus tests:**
- Validates transition via statusWorkflowService
- Rejects invalid transitions with 400
- Accepts valid transitions and creates activity log
- Supports admin override with `override: true`
- Returns 404 for non-existent case
- Returns 500 on database error

**getChartData tests:**
- violation-distribution: returns grouped counts
- attorney-workload: returns attorney names and counts
- status-distribution: returns status counts
- Returns 400 for unknown chart type

**getWorkloadDistribution tests:**
- Returns operators and attorneys with utilization
- Returns empty array when no staff exist

## Files Changed

### New
- None (extending existing files)

### Modified
- `backend/src/controllers/admin.controller.js` — add 7 new handler functions
- `backend/src/routes/admin.routes.js` — wire 7 new routes
- `backend/src/__tests__/admin.controller.test.js` — add ~25 new test cases

## Acceptance Criteria
- [x] `GET /api/admin/dashboard/stats` returns real aggregate case metrics
- [x] `GET /api/admin/cases` returns all cases with joins, filtering, and pagination
- [x] `GET /api/admin/cases/:id` returns full case detail with activity log
- [x] `GET /api/admin/operators` returns operators with active case counts
- [x] `PATCH /api/admin/cases/:id/status` validates transitions via workflow service
- [x] `PATCH /api/admin/cases/:id/status` with `override: true` allows admin to bypass workflow
- [x] `GET /api/admin/charts/:type` returns aggregated chart data for 3 chart types
- [x] `GET /api/admin/workload` returns staff utilization percentages
- [x] All new endpoints require admin authentication (return 401/403 for non-admins)
- [x] Backend tests pass: `npm test` from `backend/`
- [x] No regressions in existing admin endpoints (user management, assignment requests)
