# Story 7.3 — Driver Case Status Page

**Epic:** Core Flow Integration
**Priority:** CRITICAL
**Status:** DONE

## User Story
As Miguel (driver),
I want to see the current status of my case in plain English with a visual timeline,
so that I always know what's happening without calling anyone.

## Context
Cases change status via `workflow.service.js` → `updateCaseStatus` on the backend.
Case status emails fire for driver-visible statuses (Story 5.3, Sprint 001).
The driver currently has no UI page to view case progress after submitting.
Route `/driver/cases/:caseId` exists as a folder but needs implementation.

## Scope

### Backend
- `GET /api/cases/:caseId` — returns full case detail for driver (already exists or extend)
- Ensure RLS: driver can only fetch their own cases
- Include: status, assigned attorney name/photo, violation info, fee amount, last updated

### Frontend (`/driver/cases/:caseId`)

**Status hero section:**
- Large status label in plain English (mapping table below)
- Status icon (colored circle: blue=active, green=resolved, grey=closed)
- Attorney name + avatar with "Message" button linking to `/driver/messages`

**Plain-English status map:**

| DB Status | Driver Sees |
|-----------|-------------|
| `new` | "We've received your ticket" |
| `assigned` | "Your attorney is reviewing it" |
| `in_progress` | "Attorney working on it" |
| `pending_court` | "Awaiting court date" |
| `pending_client` | "Action needed — check messages" |
| `resolved` | "Case resolved!" |
| `closed` | "Case closed" |
| `withdrawn` | "Case withdrawn" |

**Timeline strip:**
- Horizontal stepper (mobile: compact dots) showing case milestones
- Completed steps in green, current in blue, future in grey

**Case detail card:**
- Citation number, violation date, fine amount, state
- Attorney assigned (name, photo, "View profile" link)
- Fee amount with payment status badge

**Pay Now CTA:**
- If `payment_status !== 'paid'` AND status is past `new`: show prominent "Pay Attorney Fee" button
- Links to `/driver/cases/:caseId/pay` (Story 7.4)

### Real-time updates
- Subscribe to Socket.io room `case:{caseId}` on mount
- On `case:status_updated` event: update status display without full page reload
- On unmount: unsubscribe

## Acceptance Criteria
- [ ] Plain-English status label shown for all 8 status values
- [ ] Timeline stepper shows correct completed/current/future steps
- [ ] Attorney name, photo, and message button visible when attorney assigned
- [ ] "Pay Attorney Fee" CTA appears when payment not yet made
- [ ] Socket.io subscription updates status in real time without page refresh
- [ ] Driver cannot access another driver's case (returns 403)
- [ ] Loading skeleton shown while fetching case data
