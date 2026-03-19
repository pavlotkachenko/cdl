# Story CD-1: Backend — Enrich Case Endpoint with Status History

## Meta

- **Sprint:** 065
- **Priority:** P0
- **Status:** DONE
- **Batch:** 1 (no dependencies)

## User Story

**As** Miguel (Driver),
**I want** to see the full status history of my case with timestamps, who made the change, and notes,
**So that** I can track exactly how my case has progressed.

## Problem

The `case_status_history` table has rich data (status, previous_status, changed_by joined with user name, notes, changed_at) and `workflow.service.js` has a `getCaseStatusHistory()` method that queries it. However:

1. `GET /api/cases/:id` does NOT include status history in the response
2. No dedicated REST endpoint exposes `case_status_history`
3. The frontend `case.statusHistory` always comes back empty, falling back to mock data

## Scope

### Files to modify

| File | Action |
|------|--------|
| `backend/src/controllers/case.controller.js` | Enrich `getCaseById` to include status history |
| `backend/src/__tests__/case.controller.test.js` | Add tests for status history in response |

### Implementation

1. In `getCaseById()` (case.controller.js), after fetching the case, call `workflow.service.getCaseStatusHistory(caseId)` to get the full status history
2. Attach the result as `case.statusHistory` in the response
3. The status history array should include: `status`, `previous_status`, `changed_by` (user full_name), `notes`, `changed_at`
4. If `getCaseStatusHistory` fails or returns empty, set `statusHistory: []` (graceful fallback)

### Response shape addition

```json
{
  "case": {
    ...existing fields...,
    "statusHistory": [
      {
        "status": "assigned_to_attorney",
        "previous_status": "reviewed",
        "changed_by": "Jane Operator",
        "notes": "Assigned to Sarah Johnson, Esq.",
        "changed_at": "2026-03-07T11:00:00.000Z"
      }
    ]
  }
}
```

## Acceptance Criteria

- [ ] `GET /api/cases/:id` response includes `statusHistory` array from `case_status_history` table
- [ ] Each history entry includes: `status`, `previous_status`, `changed_by` (user name), `notes`, `changed_at`
- [ ] Status history is ordered by `changed_at` DESC (most recent first)
- [ ] If no status history exists, `statusHistory` is an empty array (not null/undefined)
- [ ] If workflow service call fails, response still succeeds with `statusHistory: []`
- [ ] Existing `GET /api/cases/:id` behavior unchanged for all other fields
- [ ] Tests pass: `cd backend && npm test`

## Test Coverage Matrix

| Source File | Test File | Action |
|------------|-----------|--------|
| `backend/src/controllers/case.controller.js` | `backend/src/__tests__/case.controller.test.js` | Update |

## Test Cases Required

1. `getCaseById` returns statusHistory array when status history exists
2. `getCaseById` returns empty statusHistory when no history records
3. `getCaseById` still returns case data when workflow service throws error (graceful fallback)
4. Status history entries include changed_by user name (not just ID)
