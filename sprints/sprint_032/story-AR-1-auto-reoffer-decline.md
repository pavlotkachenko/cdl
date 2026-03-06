# Story AR-1 — Auto Re-offer on Attorney Decline

**Sprint:** 032 — Payment Plans + Auto Re-offer
**Priority:** P1
**Status:** DONE

## User Story

As a platform operator,
I want the system to automatically offer declined cases to the next-best attorney,
so cases are not left unassigned when an attorney declines.

## Scope

### `backend/src/controllers/case.controller.js` — UPDATED

In `declineCase()` — after setting `status = 'new'` and `assigned_attorney_id = null`:
- Call `assignmentService.autoAssign(caseId)` to find next-best attorney
- If found: update case `assigned_attorney_id = nextAttorney.id`, status = `'assigned'`
- Send notification to next attorney via `notificationService.notifyAttorneyNewCase(caseId, nextAttorney.id)`
- Log activity: "Case re-offered to [attorney name] after previous attorney declined"
- If no attorney found: leave status = `'new'`, send admin alert

### `backend/src/services/assignment.service.js` — UPDATED

In `autoAssign()`:
- Accept optional `excludeAttorneyIds[]` parameter (to skip previously declined attorneys)
- Pass `caseId`'s existing `declined_by` list when called from `declineCase()`

### `backend/src/migrations/` (no new migration needed)

Cases table already has `assigned_attorney_id` and activity log. Add `declined_by_attorney_ids UUID[]` column to `cases` via inline `ALTER TABLE` in `declineCase()` if not present, or use existing activity log to derive exclusion list.

Actually: add `declined_by_attorney_ids UUID[] DEFAULT '{}'` to cases table in new migration.

### `backend/src/migrations/014_declined_attorneys.sql` — CREATED

```sql
ALTER TABLE cases ADD COLUMN IF NOT EXISTS declined_by_attorney_ids UUID[] DEFAULT '{}';
```

## Acceptance Criteria

- [x] When attorney declines, system calls `autoAssign` with exclusion list within 30 seconds
- [x] Next-best attorney (by score) receives push notification
- [x] Declined attorney's ID added to `declined_by_attorney_ids`
- [x] Same attorney never offered same case twice
- [x] If no eligible attorneys remain, case stays `'new'` and admin is alerted
- [x] Activity log entry created for re-offer event

## Test Coverage Matrix

| Source File | Test File | Status |
|---|---|---|
| `case.controller.js` (declineCase) | `case.decline.test.js` | DONE |
| `assignment.service.js` (autoAssign exclusion) | `assignment.service.test.js` | DONE |
