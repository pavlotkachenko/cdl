# Story 6.10 — Tests: message.service.js

**Epic:** Backend Test Coverage
**Priority:** MEDIUM
**Status:** DONE

## User Story
As a developer,
I want unit tests for message creation guards,
so that content length limits and sender authorization are enforced at the service layer.

## Scope
- `createMessage` — conversation not found 404, closed conversation 400, unauthorized sender 403, content > 10,000 chars 400, success creates message and updates conversation
- `createMessageWithFile` — closed conversation 400, unauthorized sender 403, storage cleanup on DB insert failure
- File: `backend/src/__tests__/message.service.test.js`

## Acceptance Criteria
- [ ] Throws AppError 404 when conversation not found
- [ ] Throws AppError 400 when conversation is closed (`closed_at` set)
- [ ] Throws AppError 403 when sender is neither driver nor attorney of conversation
- [ ] Throws AppError 400 when content exceeds 10,000 characters
- [ ] Updates `last_message_at` on conversation after message created
- [ ] `createMessageWithFile` calls `storageService.deleteFile` when DB insert fails
