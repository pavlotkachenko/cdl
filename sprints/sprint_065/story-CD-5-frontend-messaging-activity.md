# Story CD-5: Frontend — Messaging & Activity Log Integration

## Meta

- **Sprint:** 065
- **Priority:** P1
- **Status:** DONE
- **Batch:** 3 (depends on CD-2, CD-4)

## User Story

**As** Miguel (Driver),
**I want** to message my attorney directly from the case detail page and see a read-only activity log of all case actions,
**So that** I can communicate about my defense and understand everything that's happened on my case.

## Problem

1. Comments in the current component are 100% mock data (`loadMockComments()`) — never calls any API
2. `addComment()` uses `setTimeout` to simulate async — no backend round-trip
3. Backend now has driver-accessible messaging (CD-2) and activity log (`GET /api/cases/:id/activity`)
4. Neither is wired up in the frontend

## Scope

### Files to modify

| File | Action |
|------|--------|
| `frontend/src/app/features/driver/case-detail/case-detail.component.ts` | Add messaging + activity log sections |
| `frontend/src/app/features/driver/case-detail/case-detail.component.spec.ts` | Add tests |
| `frontend/src/app/core/services/case.service.ts` | Add `getCaseActivity(caseId)` method |
| `frontend/src/app/core/services/case.service.spec.ts` | Add test for new method |

### Messaging Section (replaces mock comments)

- **Data source:** `GET /api/cases/:caseId/messages` (from CD-2)
- **Send:** `POST /api/cases/:caseId/messages` with `{ content }` body
- **Display:**
  - Message thread chronological (ASC)
  - Each message: avatar circle with initials, sender name, role badge (Attorney/Driver), timestamp, message text
  - Staff/attorney messages: left-aligned with teal left border
  - Driver messages: right-aligned with gray background
  - Attorney-client privilege notice banner at top: "Messages are protected by attorney-client privilege"
- **Form:**
  - Reactive form with textarea + character counter
  - Minimum 10 characters validation (preserved from current)
  - Send button with send emoji/SVG icon
  - Loading state while sending
- **Signals:**
  - `messages = signal<Message[]>([])`
  - `sendingMessage = signal(false)`
  - `messageError = signal('')`

### Activity Log Section (read-only)

- **Data source:** `GET /api/cases/:caseId/activity`
- **Display:**
  - Compact vertical list, read-only
  - Each entry: timestamp + action description + user name
  - Collapsible/expandable (default collapsed if > 5 entries)
  - Examples: "Status changed to Under Review by Jane Operator", "Document uploaded by Miguel Driver"
- **Placement:** Below the messaging section as a separate collapsible card
- **Signals:**
  - `activityLog = signal<Activity[]>([])`

### Frontend Service Addition

```typescript
// In case.service.ts
getCaseActivity(caseId: string): Observable<any> {
  return this.http.get(`${this.apiUrl}/cases/${caseId}/activity`);
}
```

## Acceptance Criteria

- [ ] Message thread displays real messages from `GET /api/cases/:caseId/messages`
- [ ] Messages show: initials avatar, sender name, role badge, timestamp, text
- [ ] Driver can send a message via the form (POST to backend)
- [ ] Message form validates minimum 10 characters
- [ ] Character counter shown below textarea
- [ ] Sending state shows spinner/disabled button
- [ ] New messages appear in thread after successful send
- [ ] Attorney-client privilege notice banner shown at top of messaging section
- [ ] Activity log section displays case activity from `GET /api/cases/:caseId/activity`
- [ ] Activity log collapsible when > 5 entries
- [ ] Empty states for both messaging (no messages yet) and activity log (no activity)
- [ ] No mock data — all data from real API endpoints
- [ ] All Angular 21 conventions (signals, native control flow, etc.)
- [ ] All tests pass: `cd frontend && npx ng test --no-watch`

## Test Coverage Matrix

| Source File | Test File | Action |
|------------|-----------|--------|
| `frontend/src/app/features/driver/case-detail/case-detail.component.ts` | `case-detail.component.spec.ts` | Update |
| `frontend/src/app/core/services/case.service.ts` | `case.service.spec.ts` | Update |

## Test Cases Required

1. Message thread renders messages from API
2. Messages display sender name, role badge, and timestamp
3. Driver messages and attorney messages have different styling
4. Send message calls POST endpoint and clears form on success
5. Send message shows error on failure
6. Form validation: disabled when < 10 characters
7. Attorney-client privilege notice displayed
8. Activity log renders entries from API
9. Activity log collapses when > 5 entries
10. Empty state shown when no messages
11. Empty state shown when no activity
