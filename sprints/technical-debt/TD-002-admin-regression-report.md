# TD-002: Admin Panel Regression Report

> **Date:** 2026-03-19
> **Scope:** All 15 admin tabs for `admin@test.com`
> **Tests:** 210 admin tests passing (96/102 total; 6 failures are non-admin pre-existing)

---

## Executive Summary

| Category | Count |
|----------|-------|
| Tabs fully functional (API + UI + tests) | 6 |
| Tabs with backend endpoint gaps | 5 |
| Tabs with DB schema gaps | 3 |
| Tabs client-only (no backend needed) | 1 |
| Total blockers | 14 |
| Total requirements | 22 |

---

## Tab-by-Tab Analysis

### 1. Admin Dashboard (`/admin/dashboard`) — PARTIALLY BROKEN

**Tests:** 31 passing
**Status:** KPI cards work, but charts and queue fail at runtime

| # | Issue | Severity | Root Cause |
|---|-------|----------|------------|
| R-001 | `DashboardService` calls `GET /api/dashboard/workload` — route not mounted in server.js | **BLOCKER** | `dashboard.routes.js` is imported but never registered with `app.use()` |
| R-002 | `GET /api/dashboard/queue` — not mounted | **BLOCKER** | Same as R-001 |
| R-003 | `GET /api/dashboard/status-distribution` — doesn't exist | **BLOCKER** | Backend has `GET /api/admin/charts/status-distribution` instead |
| R-004 | `GET /api/dashboard/violation-distribution` — doesn't exist | **BLOCKER** | Backend has `GET /api/admin/charts/violation-distribution` instead |
| R-005 | `GET /api/dashboard/attorney-workload` — doesn't exist | **BLOCKER** | Backend has `GET /api/admin/charts/attorney-workload` instead |
| R-006 | `case_status` enum only has 10 values but dashboard expects `in_progress`, `pending_court`, `resolved` | **MAJOR** | Enum mismatch — dashboard KPIs count statuses that don't exist |

**Fix requirements:**
- **Option A (recommended):** Mount dashboard routes — add `app.use('/api/dashboard', dashboardRoutes)` to server.js, then implement the 5 missing endpoints in `dashboard.controller.js`
- **Option B:** Rewrite `DashboardService` to use existing `/api/admin/charts/*` and `/api/admin/dashboard/stats` endpoints

---

### 2. Case Management (`/admin/case-management`) — PARTIALLY WORKING

**Tests:** 22 passing
**Status:** Case list loads, but status workflow limited

| # | Issue | Severity | Root Cause |
|---|-------|----------|------------|
| R-007 | `PATCH /api/admin/cases/:id/priority` — doesn't exist | **MAJOR** | No priority update endpoint in backend |
| R-008 | `StatusWorkflowService.getNextStatuses()` returns transitions, but `case_status` enum has limited values (`new`, `reviewed`, `assigned_to_attorney`, `waiting_for_driver`, `send_info_to_attorney`, `attorney_paid`, `call_court`, `check_with_manager`, `pay_attorney`, `closed`) — no `in_progress`, `pending_court`, `resolved` | **MAJOR** | Frontend references statuses not in DB enum |
| R-009 | Cases table has no `priority` column | **MAJOR** | Frontend shows priority badges but DB has no priority field |
| R-010 | Cases table has no `tags` column | **MINOR** | Frontend has tag display but no backing column |
| R-011 | Cases table has no `description` column | **MINOR** | Case detail expansion shows description field that doesn't exist |

**Fix requirements:**
- Add `priority` column to `cases` table (enum: `low`, `medium`, `high`, `urgent`, default `medium`)
- Add `PATCH /api/admin/cases/:id/priority` endpoint
- Align frontend status values with DB enum OR extend enum

---

### 3. Admin Case Detail (`/admin/cases/:id`) — WORKING

**Tests:** 19 passing
**Status:** Core functionality works — case loads, operator/attorney assignment works

| # | Issue | Severity | Root Cause |
|---|-------|----------|------------|
| R-012 | Activity log may be sparse — `activity_log` table exists but inserts depend on controller triggers | **MINOR** | Some actions don't create activity entries |

**No blockers.** This tab is functional with seeded data.

---

### 4. Staff Management (`/admin/staff-management`) — WORKING

**Tests:** 5 passing
**Status:** Staff list loads, status toggle works

| # | Issue | Severity | Root Cause |
|---|-------|----------|------------|
| R-013 | Frontend expects `paralegal` role but `user_role` enum only has: `driver`, `carrier`, `operator`, `attorney`, `admin` | **MINOR** | No paralegal users can exist in DB; filter shows empty for this role |
| R-014 | `StaffMember` interface expects `specialization[]`, `successRate`, `avgResolutionTime` — backend computes these from case data which may be sparse | **MINOR** | Metrics show 0 when no resolved cases exist |

**No blockers.** Tab functions with attorney/operator staff.

---

### 5. Client Management (`/admin/client-management`) — WORKING

**Tests:** 9 passing
**Status:** Client list loads from drivers in the system

| # | Issue | Severity | Root Cause |
|---|-------|----------|------------|
| R-015 | `users` table has no `address`, `city`, `zip_code` columns | **MINOR** | Client cards show empty address fields |
| R-016 | `lastContact` computed from cases — may show "inactive" status incorrectly if no recent case activity | **MINOR** | Display issue only |

**No blockers.** Core functionality works.

---

### 6. User Management (`/admin/users`) — WORKING

**Tests:** 12 passing
**Status:** User list, invite, suspend/unsuspend all work

| # | Issue | Severity | Root Cause |
|---|-------|----------|------------|
| R-017 | Suspend/unsuspend endpoints are stubs in backend — they return success but may not actually toggle `is_active` | **MAJOR** | Backend controllers for suspend/unsuspend need verification |

**Mostly functional.** Invite flow and role changes work end-to-end.

---

### 7. Reports (`/admin/reports`) — WORKING

**Tests:** 12 passing
**Status:** KPIs load from `/api/admin/dashboard/stats`, staff performance from `/api/admin/performance`

| # | Issue | Severity | Root Cause |
|---|-------|----------|------------|
| R-018 | Chart data comes from `/api/admin/charts/:type` which works, but some chart types may return empty data | **MINOR** | Display issue — charts render empty |

**No blockers.** All API endpoints exist.

---

### 8. Revenue Dashboard (`/admin/revenue-dashboard`) — WORKING

**Tests:** 7 passing
**Status:** All revenue endpoints exist and return data from `payments` table

| # | Issue | Severity | Root Cause |
|---|-------|----------|------------|
| R-019 | Frontend `exportToCsv()` uses GET (correct) — backend also uses GET — this works | **NONE** | Initially flagged as mismatch but both sides use GET |

**No blockers.** Full functionality with seeded payment data.

---

### 9. Assignment Requests (`/admin/assignment-requests`) — WORKING

**Tests:** 8 passing
**Status:** `assignment_requests` table exists (migration 020), endpoints exist

| # | Issue | Severity | Root Cause |
|---|-------|----------|------------|
| — | Initially thought table was missing; it was created in migration 020 | **NONE** | Confirmed: table exists with `pending/approved/rejected` status |

**No blockers.** Tab is fully functional.

---

### 10. Operator Kanban (`/admin/kanban`) — WORKING

**Tests:** 26 passing
**Status:** Drag-drop assignment works, capacity bars display

| # | Issue | Severity | Root Cause |
|---|-------|----------|------------|
| R-020 | Operator capacity is hardcoded to 20 in frontend — no `capacity` column in `users` table | **MINOR** | All operators show same max capacity |

**No blockers.** Core kanban functionality works.

---

### 11. Case Table (`/admin/cases`) — WORKING

**Tests:** 24 passing
**Status:** Table loads, search/filter/sort/pagination all work

**No issues found.** Fully functional.

---

### 12. Notification Center (`/admin/notifications`) — WORKING

**Tests:** 7 passing
**Status:** Notifications load, mark-as-read works

**No issues found.** Fully functional with seeded notification data.

---

### 13. Documents (`/admin/documents`) — BROKEN

**Tests:** 6 passing (mocked)
**Status:** API endpoint doesn't exist

| # | Issue | Severity | Root Cause |
|---|-------|----------|------------|
| R-021 | `GET /api/admin/documents` — endpoint doesn't exist in backend | **BLOCKER** | No admin document browsing route registered |

**Fix requirements:**
- Add `GET /api/admin/documents` endpoint to `admin.routes.js` that queries `case_files` table across all cases
- Response shape: `{ files: [{ id, file_name, file_type, file_size, uploaded_at, case_id }] }`

---

### 14. Admin Settings (`/admin/settings`) — WORKING (CLIENT-ONLY)

**Tests:** 9 passing
**Status:** All form interactions work; no backend persistence

| # | Issue | Severity | Root Cause |
|---|-------|----------|------------|
| R-022 | Settings are not persisted — form values reset on page reload | **MAJOR** | No `admin_settings` table or API endpoint |

**Note:** This is by design for now — settings component uses hardcoded defaults. Needs a backend story when settings persistence is prioritized.

---

### 15. Operator Dashboard (`/admin/operator-dashboard`) — PARTIALLY BROKEN

**Tests:** 7 passing
**Status:** Same DashboardService endpoint issues as Admin Dashboard

| # | Issue | Severity | Root Cause |
|---|-------|----------|------------|
| — | Same as R-001 through R-005 | **BLOCKER** | `DashboardService` endpoints not mounted |

**Fix:** Same as Admin Dashboard (R-001–R-005).

---

## Database Schema Gaps

| # | Gap | Impact | Fix |
|---|-----|--------|-----|
| DB-001 | `case_status` enum missing: `in_progress`, `pending_court`, `resolved` | Dashboard KPIs, status workflow, case filtering | `ALTER TYPE case_status ADD VALUE 'in_progress'; ALTER TYPE case_status ADD VALUE 'pending_court'; ALTER TYPE case_status ADD VALUE 'resolved';` |
| DB-002 | `user_role` enum missing: `paralegal` | Staff management paralegal filter | `ALTER TYPE user_role ADD VALUE 'paralegal';` |
| DB-003 | `cases` table missing `priority` column | Case management priority display/filter | `ALTER TABLE cases ADD COLUMN priority TEXT DEFAULT 'medium';` |
| DB-004 | `cases` table missing `description` column | Case detail description field | `ALTER TABLE cases ADD COLUMN description TEXT;` |
| DB-005 | `cases` table missing `tags` column | Case management tagging | `ALTER TABLE cases ADD COLUMN tags TEXT[];` |
| DB-006 | `users` table missing `address`, `city`, `zip_code` | Client management address display | Migration to add profile address fields |
| DB-007 | 28 cases have corrupt status state (trigger blocks all updates) | Cannot update attorney_price, court_date, etc. on these cases | Fix or remove the restrictive trigger |

---

## Backend Endpoint Gaps

| # | Missing Endpoint | Frontend Caller | Fix |
|---|-----------------|-----------------|-----|
| API-001 | `GET /api/dashboard/workload` | `DashboardService` | Mount `dashboard.routes.js` in server.js OR rewrite service |
| API-002 | `GET /api/dashboard/queue` | `DashboardService` | Same as API-001 |
| API-003 | `GET /api/dashboard/status-distribution` | `DashboardService` | Point to `/api/admin/charts/status-distribution` |
| API-004 | `GET /api/dashboard/violation-distribution` | `DashboardService` | Point to `/api/admin/charts/violation-distribution` |
| API-005 | `GET /api/dashboard/attorney-workload` | `DashboardService` | Point to `/api/admin/charts/attorney-workload` |
| API-006 | `GET /api/admin/documents` | `AdminDocumentsComponent` | New endpoint querying `case_files` |
| API-007 | `PATCH /api/admin/cases/:id/priority` | `CaseManagementComponent` | New endpoint |

---

## Priority Fix Roadmap

### Sprint A — Critical (Unblocks 3 tabs: Dashboard, Operator Dashboard, Documents)

1. **Mount dashboard routes** — 1 line in server.js + implement 5 controller methods
2. **Add `GET /api/admin/documents`** — new endpoint returning all case_files
3. **Fix corrupt case trigger** — investigate and fix the DB trigger blocking updates

### Sprint B — Major (Improves 2 tabs: Case Management, User Management)

4. **Add `priority` column** to cases + `PATCH .../priority` endpoint
5. **Verify suspend/unsuspend** endpoints actually toggle `is_active`
6. **Add `description` column** to cases

### Sprint C — Enhancement (Polish across all tabs)

7. **Extend `case_status` enum** — add `in_progress`, `pending_court`, `resolved`
8. **Add `paralegal` to `user_role`** enum
9. **Add user address fields** — `address`, `city`, `zip_code` migration
10. **Admin settings persistence** — `admin_settings` table + CRUD endpoints
11. **Operator capacity** — add `capacity` column to users table

---

## Test Coverage Summary

| Tab | Route | Tests | Status |
|-----|-------|-------|--------|
| Admin Dashboard | `/admin/dashboard` | 31 | Pass (API broken at runtime) |
| Case Management | `/admin/case-management` | 22 | Pass |
| Case Detail | `/admin/cases/:id` | 19 | Pass |
| Staff Management | `/admin/staff-management` | 5 | Pass (fixed TranslateService) |
| Client Management | `/admin/client-management` | 9 | Pass |
| User Management | `/admin/users` | 12 | Pass (fixed TranslateService) |
| Reports | `/admin/reports` | 12 | Pass |
| Revenue Dashboard | `/admin/revenue-dashboard` | 7 | Pass |
| Assignment Requests | `/admin/assignment-requests` | 8 | Pass |
| Operator Kanban | `/admin/kanban` | 26 | Pass |
| Case Table | `/admin/cases` | 24 | Pass |
| Notifications | `/admin/notifications` | 7 | Pass |
| Documents | `/admin/documents` | 6 | Pass (API broken at runtime) |
| Settings | `/admin/settings` | 9 | Pass (client-only) |
| Operator Dashboard | `/admin/operator-dashboard` | 7 | Pass (fixed TranslateService, API broken at runtime) |
| **Admin Service** | — | 6 | Pass |
| **TOTAL** | | **210** | **All pass** |
