# Story AC-3: Replace Admin Dashboard Mock Data with Real API Integration

## Status: DONE

## Priority: P0

## Depends On: AC-1 (backend endpoints must exist before frontend can call them)

## Description
The admin dashboard currently contains **6 hardcoded mock data arrays** that mask the absence
of real backend endpoints. With AC-1 providing the endpoints, this story removes all mocks
and wires the dashboard to real data. This is a refactoring-heavy story with zero new features
— the goal is making existing UI elements show real data.

## Current Mock Inventory

### Hardcoded Arrays to Remove
| Mock | Location | Used By | Replacement |
|---|---|---|---|
| `MOCK_OPERATORS` (3 items) | `admin-dashboard.component.ts` ~line 59 | Operator assignment dropdown | `GET /api/admin/operators` |
| `MOCK_ATTORNEYS` (5 items) | `admin-dashboard.component.ts` ~line 64 | Attorney assignment dropdown | `GET /api/operator/attorneys` |
| `MOCK_QUEUE` (8 items) | `admin-dashboard.component.ts` ~line 70 | Case queue fallback | `GET /api/admin/cases?status=new,reviewed&limit=20` |
| `MOCK_VIOLATION_DATA` | `admin-dashboard.component.ts` | Violation type bar chart | `GET /api/admin/charts/violation-distribution` |
| `MOCK_ATTORNEY_WORKLOAD` | `admin-dashboard.component.ts` | Attorney workload chart | `GET /api/admin/charts/attorney-workload` |
| Mock fallback in `loadStats()` | `admin-dashboard.component.ts` | KPI tiles | `GET /api/admin/dashboard/stats` |

### Service Methods with Mock Fallbacks
The `AdminService` and `DashboardService` use `catchError()` → mock data. These need to be
updated to propagate errors instead of silently serving stale mock data. Use a proper loading
→ error → empty state pattern.

## Implementation

### Phase 1: Wire Real API Calls

#### KPI Tiles
- Call `adminService.getDashboardStats()` → `GET /api/admin/dashboard/stats`
- Map response fields to existing tile structure
- Show loading skeleton while fetching
- Show error state (red alert) if endpoint fails — no silent mock fallback

#### Case Queue
- Call `adminService.getAllCases()` with filter for active cases
- Replace `MOCK_QUEUE` fallback entirely
- Wire `searchTerm`, `queueStatusFilter`, `queuePriorityFilter` signals to API params
- Show "No cases match filters" empty state instead of mock data

#### Operator Dropdown
- Call `adminService.getOperators()` → `GET /api/admin/operators`
- Replace `MOCK_OPERATORS` with real operator list
- Show operator name + active case count in dropdown option

#### Attorney Dropdown
- Call existing `GET /api/operator/attorneys` (already exists in operator routes, admin authorized)
- Replace `MOCK_ATTORNEYS` with real attorney list
- Show attorney name + active case count in dropdown option

#### Charts
- Violation distribution: call `GET /api/admin/charts/violation-distribution`
- Attorney workload: call `GET /api/admin/charts/attorney-workload`
- Status distribution: call `GET /api/admin/charts/status-distribution`
- Remove `MOCK_VIOLATION_DATA` and `MOCK_ATTORNEY_WORKLOAD`
- Show "No data available" placeholder if chart data is empty

#### Staff Workload Section
- Call `adminService.getWorkloadDistribution()` → `GET /api/admin/workload`
- Replace any mock staff data with real utilization metrics
- Color-code utilization: green (<70%), yellow (70-90%), red (>90%)

### Phase 2: Update Service Layer

#### `admin.service.ts` Changes
- `getDashboardStats()`: Remove mock fallback, add proper error typing
- `getAllCases(filters)`: Implement query params (status, priority, operator_id, search, limit, offset)
- `getOperators()`: New method → `GET /api/admin/operators`
- `updateCaseStatus(caseId, status, comment?)`: Wire to new AC-1 endpoint
- `getChartData(type)`: New method → `GET /api/admin/charts/:type`
- `getWorkloadDistribution()`: Remove mock fallback

#### `dashboard.service.ts` Changes
- `getCaseQueue()`: Point to `GET /api/admin/cases` with active status filter (or keep
  existing if it works — verify)
- `getViolationTypeDistribution()`: Point to `GET /api/admin/charts/violation-distribution`
- `getAttorneyWorkloadDistribution()`: Point to `GET /api/admin/charts/attorney-workload`
- Remove all `catchError(() => of(MOCK_DATA))` patterns

### Phase 3: Loading & Error States

Replace the current pattern (mock fallback on error) with proper UX:

```
Loading → Success (show data)
       → Error (show retry button + error message)
       → Empty (show "No data yet" message)
```

Each dashboard section should have its own independent loading/error state so one failed API
call doesn't break the entire dashboard.

#### Per-Section Signals
```typescript
// Replace single loading signal with per-section signals
statsLoading = signal(false);
statsError = signal('');
queueLoading = signal(false);
queueError = signal('');
chartsLoading = signal(false);
chartsError = signal('');
workloadLoading = signal(false);
workloadError = signal('');
operatorsLoading = signal(false);
attorneysLoading = signal(false);
```

### Phase 4: Remove Dead Code

After wiring real data:
- Delete all `MOCK_*` constant arrays
- Delete mock fallback functions
- Delete any unused imports related to mock data generation
- Remove `TODO` / `coming soon` comments that are now resolved

## Files Changed

### Modified
- `frontend/src/app/features/admin/dashboard/admin-dashboard.component.ts` — major refactor:
  remove 6 mock arrays, wire real API calls, add per-section loading/error states
- `frontend/src/app/features/admin/dashboard/admin-dashboard.component.spec.ts` — update
  tests to mock real service calls instead of expecting mock data
- `frontend/src/app/core/services/admin.service.ts` — add/update methods, remove mock fallbacks
- `frontend/src/app/core/services/dashboard.service.ts` — update chart methods, remove mock fallbacks

## Non-Functional Requirements

### Performance
- Dashboard should not make more than 5 parallel API calls on load
- Use `forkJoin` or `combineLatest` to batch independent requests
- Charts should lazy-render (only fetch chart data when section scrolls into view, or after
  initial stats/queue load completes)

### Error Resilience
- Each section fails independently — a chart endpoint failure doesn't block KPI tiles
- Retry button on each failed section allows targeted retry without full page reload
- Network timeout: 10 seconds per request before showing error

### Accessibility
- Loading skeletons have `aria-busy="true"` and `role="status"`
- Error messages have `role="alert"`
- Empty states are informative, not just blank space

## Tests

### Updated Tests (admin-dashboard.component.spec.ts)
- Stats section: calls getDashboardStats, renders KPI tiles with real data
- Stats section: shows error state when API fails (not mock data)
- Case queue: calls getAllCases, renders case rows with real data
- Case queue: filters pass through to API call
- Case queue: shows empty state when no cases
- Operator dropdown: calls getOperators, renders real operator list
- Attorney dropdown: calls getAttorneys, renders real attorney list
- Charts: calls getChartData, renders chart elements
- Charts: shows placeholder when chart data empty
- Workload: calls getWorkloadDistribution, renders utilization bars
- Auto-assign: calls real assignment endpoint
- Assign operator: passes real operator ID (not mock)
- Per-section error states work independently
- Minimum update +10 tests (some existing tests will need rewrite)

## Acceptance Criteria
- [x] Zero `MOCK_*` arrays remain in admin-dashboard.component.ts
- [x] Zero `catchError(() => of(mockData))` patterns remain in admin services
- [x] KPI tiles show real aggregate data from `GET /api/admin/dashboard/stats`
- [x] Case queue loads from `GET /api/admin/cases` with real filter parameters
- [x] Operator dropdown populated from `GET /api/admin/operators` (real data)
- [x] Attorney dropdown populated from `GET /api/operator/attorneys` (real data)
- [x] Violation chart populated from `GET /api/admin/charts/violation-distribution`
- [x] Attorney workload chart populated from `GET /api/admin/charts/attorney-workload`
- [x] Status distribution chart populated from `GET /api/admin/charts/status-distribution`
- [x] Staff workload section shows real utilization from `GET /api/admin/workload`
- [x] Each section has independent loading → success/error/empty states
- [x] Failed sections show retry button, not mock data
- [x] Frontend tests pass with updated assertions
- [x] Build succeeds with no errors
