# Story CM-1: Backend Fixes — canAccessCase, Authorization, Status Enum & Error Format

## Status: TODO

## Priority: P0 (blocker — all other stories depend on this)

## Depends On: Nothing

## Description
Fix four backend defects discovered during the operator gap analysis. These are foundation-level
issues that affect data access, authorization, and data integrity for the entire operator
workflow.

### Bug 1: `canAccessCase` middleware — wrong column names (CRITICAL)
**File:** `backend/src/middleware/auth.js:145`

**Problem:** The middleware selects `created_by, operator_id, attorney_id` from the `cases`
table, but these columns do not exist. The actual columns are:
- `driver_id` (not `created_by`)
- `assigned_operator_id` (not `operator_id`)
- `assigned_attorney_id` (not `attorney_id`)

**Impact:** Any non-admin user hitting an endpoint that uses `canAccessCase` would likely
receive a 404 (Supabase returns an error for non-existent columns) or a 403 (all access
fields resolve to `null`). Affected endpoints:
- `GET /api/cases/:id` (getCaseById)
- `PATCH /api/cases/:id` (updateCase)
- `POST /api/cases/:id/status` (changeStatus)
- `GET /api/cases/:id/activity` (getCaseActivity)
- `GET /api/cases/:id/documents` (listDocuments)
- `GET /api/cases/:id/attorneys` (getRecommendedAttorneys)

**Fix:**
```javascript
// BEFORE (broken):
.select('created_by, operator_id, attorney_id')
// ...
caseData.created_by === userId ||
caseData.operator_id === userId ||
caseData.attorney_id === userId;

// AFTER (correct):
.select('driver_id, assigned_operator_id, assigned_attorney_id')
// ...
caseData.driver_id === userId ||
caseData.assigned_operator_id === userId ||
caseData.assigned_attorney_id === userId;
```

### Bug 2: Document upload restricted to `driver` role only
**File:** `backend/src/routes/case.routes.js:238`

**Problem:** `POST /api/cases/:id/documents` uses `authorize(['driver'])`. Operators who
need to attach files to cases are blocked. The separate `/api/files/upload` endpoint does
allow operator access (checked by `assigned_operator_id`), but the case-specific document
endpoint doesn't.

**Fix:** Change `authorize(['driver'])` to `authorize(['driver', 'operator', 'admin'])`.
Also update `uploadDocument` in `case.controller.js` to check access by
`assigned_operator_id` (not just `driver_id === req.user.id`).

### Bug 3: `resolved` status — frontend uses it, DB enum doesn't have it
**File:** `operator-dashboard.component.ts:48` (frontend) vs `supabase_schema.sql:30` (DB)

**Problem:** The dashboard has `resolved: 'OPR.STATUS_RESOLVED'` in STATUS_LABELS and a
`.status-resolved` CSS class, but `resolved` is not in the `case_status` enum:
```sql
CREATE TYPE case_status AS ENUM (
  'new', 'reviewed', 'assigned_to_attorney', 'waiting_for_driver',
  'send_info_to_attorney', 'attorney_paid', 'call_court',
  'check_with_manager', 'pay_attorney', 'closed'
);
```

**Decision needed:** Either:
- **(A)** Add `resolved` to the enum via migration (separate from `closed`) — if the business
  needs a distinction between "resolved" (outcome determined) and "closed" (case archived)
- **(B)** Remove `resolved` from the frontend and map all completions to `closed`

**Recommendation:** Option (A) — add `resolved` as a step before `closed`. A case can be
resolved (fine paid, charges dropped) but not yet closed (final paperwork pending). This
matches the requirement of "manages through statuses until completed."

**Migration (`017_add_resolved_status.sql`):**
```sql
ALTER TYPE case_status ADD VALUE IF NOT EXISTS 'resolved' BEFORE 'closed';
```

### Bug 4: Missing status labels & inconsistent error format
**File:** `operator-dashboard.component.ts:39–50`

**Problem:** `STATUS_LABELS` is missing three valid statuses:
- `attorney_paid` — no label, will display raw enum value
- `check_with_manager` — no label
- `pay_attorney` — no label

Also, the `operator.controller.js` error responses use inconsistent format:
```javascript
// Some endpoints use:
res.status(500).json({ error: { code: 'FETCH_ERROR', message: '...' } }); // correct
// Others use:
res.status(500).json({ error: 'Failed to fetch attorneys' }); // wrong per CLAUDE.md
```

**Fix:**
- Add missing labels: `attorney_paid: 'OPR.STATUS_ATTORNEY_PAID'`,
  `check_with_manager: 'OPR.STATUS_CHECK_MANAGER'`, `pay_attorney: 'OPR.STATUS_PAY_ATTORNEY'`
- Normalize all operator controller error responses to `{ error: { code, message } }` format

## Changes

### `backend/src/middleware/auth.js`
- Fix `canAccessCase`: change column names from `created_by, operator_id, attorney_id`
  to `driver_id, assigned_operator_id, assigned_attorney_id`

### `backend/src/routes/case.routes.js`
- Line 238: change `authorize(['driver'])` to `authorize(['driver', 'operator', 'admin'])`
- Line 254: change `authorize(['driver'])` (delete document) to
  `authorize(['driver', 'operator', 'admin'])`

### `backend/src/controllers/case.controller.js`
- `uploadDocument`: add access check for `assigned_operator_id` (not just `driver_id`)
- `deleteDocument`: add access check for uploader or admin

### `backend/src/controllers/operator.controller.js`
- `getAvailableAttorneys` (line 223): fix error format to `{ error: { code, message } }`

### `backend/src/migrations/017_add_resolved_status.sql` (NEW)
- Add `resolved` to `case_status` enum

### `frontend/src/app/features/operator/operator-dashboard/operator-dashboard.component.ts`
- Add missing STATUS_LABELS entries: `attorney_paid`, `check_with_manager`, `pay_attorney`
- Add i18n keys for new labels

### `frontend/src/assets/i18n/en.json`, `es.json`, `fr.json`
- Add keys: `OPR.STATUS_ATTORNEY_PAID`, `OPR.STATUS_CHECK_MANAGER`, `OPR.STATUS_PAY_ATTORNEY`

## Acceptance Criteria
- [ ] `canAccessCase` uses correct column names: `driver_id`, `assigned_operator_id`, `assigned_attorney_id`
- [ ] Driver can access their own case via `GET /api/cases/:id`
- [ ] Operator can access their assigned case via `GET /api/cases/:id`
- [ ] Attorney can access their assigned case via `GET /api/cases/:id`
- [ ] Non-assigned users get 403
- [ ] Operator can upload documents to their assigned case via `POST /api/cases/:id/documents`
- [ ] Operator can delete their own uploaded documents
- [ ] `resolved` status added to DB enum via migration
- [ ] STATUS_LABELS in dashboard includes all 11 status values (10 original + resolved)
- [ ] All operator controller error responses follow `{ error: { code, message } }` format
- [ ] Existing dashboard tests still pass (backward-compatible)
- [ ] Build succeeds with no errors

## Test Coverage

### Backend Tests (`backend/src/__tests__/auth.middleware.test.js` — new or extend)
- `canAccessCase` allows driver to access their own case (`driver_id` match)
- `canAccessCase` allows operator to access assigned case (`assigned_operator_id` match)
- `canAccessCase` allows attorney to access assigned case (`assigned_attorney_id` match)
- `canAccessCase` returns 403 for unrelated user
- `canAccessCase` allows admin to access any case
- `canAccessCase` returns 404 for non-existent case

### Backend Tests (`backend/src/__tests__/case.controller.test.js` — extend)
- `uploadDocument` allows operator to upload to their assigned case
- `uploadDocument` returns 403 for non-assigned operator
- `deleteDocument` allows operator to delete their own upload
- `deleteDocument` returns 403 for deleting another user's upload

### Frontend Tests
- STATUS_LABELS returns a label for every `case_status` enum value
- No raw enum value displayed for any status
