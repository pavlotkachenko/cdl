# Story 7.8 — Operator Case Queue

**Epic:** Core Flow Integration
**Priority:** HIGH
**Status:** TODO

## User Story
As an operator (case manager),
I want to see all unassigned cases in a queue with the ability to assign or auto-assign,
so that no case sits idle without an attorney.

## Context
`assignment.service.js` → `autoAssign` handles automatic attorney selection.
Cases submitted by drivers land in `status = 'new'` with no attorney.
Currently no operator UI exists to monitor or route these cases.
The `operator` feature folder exists but is empty beyond routing boilerplate.

## Scope

### Backend
- `GET /api/operator/cases?status=new` — unassigned cases list (operator role required)
  - Returns: `caseId`, `caseNumber`, `driverName`, `violationType`, `violationState`, `fineAmount`, `submittedAt`, age in hours
- `GET /api/operator/attorneys` — list of available attorneys for manual assignment
  - Returns: `id`, `fullName`, `activeCount`, `specializations`, `jurisdictions`
- `POST /api/cases/:caseId/auto-assign` — triggers `autoAssign` from `assignment.service.js`
- `POST /api/cases/:caseId/manual-assign` — body `{ attorneyId }`, assigns directly

### Frontend (route: `/operator/dashboard`)

**Summary strip:**
- 3 metric cards: "New Cases" (count), "Avg. Age" (hours unassigned), "Assigned Today" (count)

**Cases table (desktop) / card list (mobile):**
- Columns: Case #, Driver, Violation Type, State, Fine, Submitted, Age, Actions
- Age column color-coded: <4h green, 4-12h yellow, >12h red
- Actions per row:
  - "Auto-Assign" button — calls auto-assign endpoint, shows success toast
  - "Assign To…" button — opens attorney picker dialog (dropdown of available attorneys)

**Attorney picker dialog:**
- Lists attorneys with `fullName`, `activeCount` (current workload), `specializations`
- "Assign" confirm button → manual assign endpoint → removes row from queue

**Status tabs:**
- "New" — unassigned cases
- "In Progress" — all active cases across attorneys (read-only overview)

**Auto-refresh:**
- Poll `GET /api/operator/cases?status=new` every 60 seconds (simple interval, not Socket.io)
- Show "Last updated X seconds ago" timestamp

## Acceptance Criteria
- [ ] Operator can see all cases with `status = 'new'` in real time
- [ ] "Auto-Assign" triggers `autoAssign` and removes case from New queue on success
- [ ] "Assign To…" opens attorney picker and assigns the selected attorney
- [ ] Age column is color-coded (green/yellow/red) based on time since submission
- [ ] Only users with `role = 'operator'` can access this route (401/403 otherwise)
- [ ] Table refreshes automatically every 60 seconds
- [ ] Empty state: "All caught up! No unassigned cases." when queue is empty
