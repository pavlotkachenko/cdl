# Story CD-2: Backend — Driver-Accessible Case Messaging Endpoints

## Meta

- **Sprint:** 065
- **Priority:** P0
- **Status:** DONE
- **Batch:** 1 (no dependencies)

## User Story

**As** Miguel (Driver),
**I want** to send messages to my attorney directly from my case detail page and see the full conversation thread,
**So that** I can communicate about my case without leaving the app.

## Problem

The messaging system currently exists at two levels:
1. **Conversation API** (`/api/conversations`) — role-agnostic, any authenticated user can access
2. **Operator case messaging** (`/api/operator/cases/:caseId/conversation|messages`) — operator-only, gets/creates conversation linked to a case

Drivers have no case-scoped messaging endpoints. The `CaseService` frontend methods (`getCaseConversation`, `getCaseMessages`, `sendCaseMessage`) all hit `/api/operator/...` routes which reject driver tokens.

## Scope

### Files to modify

| File | Action |
|------|--------|
| `backend/src/routes/case.routes.js` | Add driver-accessible messaging routes |
| `backend/src/controllers/case.controller.js` | Add `getCaseConversation`, `getCaseMessages`, `sendCaseMessage` handlers |
| `backend/src/__tests__/case.controller.test.js` | Add tests for new messaging endpoints |
| `frontend/src/app/core/services/case.service.ts` | Add driver-scoped messaging methods OR update existing ones to use new routes |

### New Endpoints

| Method | Endpoint | Auth | Handler |
|--------|----------|------|---------|
| GET | `/api/cases/:id/conversation` | authenticate, canAccessCase | Get or create conversation for case |
| GET | `/api/cases/:id/messages` | authenticate, canAccessCase | Get messages for case conversation |
| POST | `/api/cases/:id/messages` | authenticate, canAccessCase | Send message in case conversation |

### Implementation Notes

1. Reuse existing conversation service logic from operator controller — the operator handlers at `/api/operator/cases/:caseId/conversation|messages` already implement get-or-create + CRUD. Extract shared logic or call the same service functions.
2. `canAccessCase` middleware already verifies the requesting user has access to the case (driver owns it, or operator/attorney assigned to it). This provides proper authorization.
3. Message schema: `{ content: string }` in request body, response returns message with `id`, `conversation_id`, `sender_id`, `sender_name`, `content`, `created_at`.
4. Include an `activity_log` entry on the case when a message is sent (for the activity feed).

### Frontend Service Update

Add to `CaseService`:
```typescript
getDriverCaseConversation(caseId: string): Observable<any> {
  return this.http.get(`${this.apiUrl}/cases/${caseId}/conversation`);
}
getDriverCaseMessages(caseId: string): Observable<any> {
  return this.http.get(`${this.apiUrl}/cases/${caseId}/messages`);
}
sendDriverCaseMessage(caseId: string, content: string): Observable<any> {
  return this.http.post(`${this.apiUrl}/cases/${caseId}/messages`, { content });
}
```

## Acceptance Criteria

- [ ] `GET /api/cases/:id/conversation` returns or creates conversation linked to the case
- [ ] `GET /api/cases/:id/messages` returns message thread for the case conversation
- [ ] `POST /api/cases/:id/messages` sends a message from the authenticated user (driver or attorney)
- [ ] Driver can only access conversations for cases they own (canAccessCase)
- [ ] Attorney can only access conversations for cases assigned to them
- [ ] Messages include sender name and role for display
- [ ] Frontend `CaseService` has methods to call the new endpoints
- [ ] Tests pass: `cd backend && npm test`

## Test Coverage Matrix

| Source File | Test File | Action |
|------------|-----------|--------|
| `backend/src/controllers/case.controller.js` | `backend/src/__tests__/case.controller.test.js` | Update |
| `frontend/src/app/core/services/case.service.ts` | `frontend/src/app/core/services/case.service.spec.ts` | Update |

## Test Cases Required

1. `GET /api/cases/:id/conversation` creates conversation on first access
2. `GET /api/cases/:id/conversation` returns existing conversation on subsequent access
3. `GET /api/cases/:id/messages` returns messages ordered by created_at ASC
4. `POST /api/cases/:id/messages` creates message and returns it with sender info
5. Driver cannot access conversation for another driver's case (403)
6. Unauthenticated request returns 401
