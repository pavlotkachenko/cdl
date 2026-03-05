# Story 6.9 — Tests: conversation.service.js

**Epic:** Backend Test Coverage
**Priority:** MEDIUM
**Status:** DONE

## User Story
As a developer,
I want unit tests for conversation access control,
so that authorization guards on createConversation are verifiably enforced.

## Scope
- `getUserConversations` — returns paginated results, handles empty list
- `createConversation` — duplicate throws 400, case not found throws 404, driver mismatch throws 403, attorney mismatch throws 400, closed case throws 400, happy path creates record
- File: `backend/src/__tests__/conversation.service.test.js`

## Acceptance Criteria
- [ ] `createConversation` throws AppError 400 when conversation already exists
- [ ] `createConversation` throws AppError 404 when case not found
- [ ] `createConversation` throws AppError 403 when driverId doesn't match case.driver_id
- [ ] `createConversation` throws AppError 400 when attorneyId not assigned to case
- [ ] `createConversation` throws AppError 400 for closed cases
- [ ] `getUserConversations` returns `{ conversations, total }` shape
