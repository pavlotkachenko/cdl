# Story 7.6 — Attorney Case Queue

**Epic:** Core Flow Integration
**Priority:** CRITICAL
**Status:** DONE

## User Story
As James (attorney),
I want to see a queue of cases waiting for my response with enough detail to decide in 30 seconds,
so that I can accept the right cases without reading full dossiers.

## Context
Cases are assigned to attorneys via `assignment.service.js` but there is no attorney-facing UI
to action these assignments. The `attorney-dashboard` component exists but is a stub.
The backend `workflow.service.js` → `updateCaseStatus` handles `pending → assigned` transitions.

## Scope

### Backend
- `GET /api/attorney/cases?status=pending` — list of cases assigned to logged-in attorney
  - Returns: `caseId`, `caseNumber`, `violationType`, `violationState`, `violationDate`, `fineAmount`, `driverName`, `submittedAt`, `status`
- `POST /api/cases/:caseId/accept` — attorney accepts case → status transitions to `assigned`
- `POST /api/cases/:caseId/decline` — attorney declines case → triggers reassignment queue
  - Requires `reason` body field (dropdown: "Outside my jurisdiction", "Conflict of interest", "At capacity", "Other")

### Frontend — Attorney Dashboard Queue Tab (`/attorney/dashboard`)

**Queue list:**
- Card per case: violation type (badge), state, fine amount, driver first name only, "submitted X hours ago"
- Two action buttons per card: "Accept" (primary) and "Decline" (outlined)
- Accept → optimistic update (card moves to "Active" tab) + API call
- Decline → opens bottom sheet with reason picker before confirming

**Tab structure:**
- Tab 1: "Pending" — cases awaiting accept/decline (badge count)
- Tab 2: "Active" — accepted cases in progress
- Tab 3: "Closed" — resolved/closed cases (last 30 days)

**Active cases tab:**
- Same card layout but with current status and "View Details" CTA linking to Story 7.7
- Last message preview if conversation exists

**Empty states:**
- Pending tab empty: "No new cases — check back soon"
- Active tab empty: "Accept cases from the Pending tab to get started"

## Acceptance Criteria
- [ ] Pending queue shows all cases assigned to the attorney with status `pending`
- [ ] Accept action transitions case to `assigned` status via API
- [ ] Decline action requires a reason and triggers backend reassignment logic
- [ ] Active tab shows only the logged-in attorney's active cases
- [ ] Tab badge count on "Pending" updates after accept/decline
- [ ] Attorney cannot see or action cases assigned to other attorneys
- [ ] Empty state shown when no cases in each tab
