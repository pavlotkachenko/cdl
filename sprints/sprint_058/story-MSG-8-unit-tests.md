# Story MSG-8: Backend + Frontend Unit Test Updates

## Status: DONE

## Description
Update all unit tests to cover the new messaging functionality introduced in stories MSG-1 through MSG-7. Ensure no regressions in existing test suites.

## Dependencies
- All other MSG stories (MSG-1 through MSG-7)

## Backend Tests

### `backend/src/__tests__/conversation.service.test.js`
Update existing tests and add new ones:

| Test | Description |
|------|-------------|
| `getUserConversations returns conversations with conversation_type field` | Verify response includes `conversation_type` on each conversation |
| `getUserConversations filters by conversation_type when provided` | Pass `{ conversationType: 'operator' }` and verify filter applied |
| `createConversation creates attorney_case conversation with case_id` | Verify `conversation_type: 'attorney_case'` set when case_id provided |
| `createConversation creates operator conversation without case_id` | Verify `conversation_type: 'operator'` set, attorney_id is null |
| `createConversation validates operator role for operator conversations` | Verify 403 when non-operator tries to create operator conversation |
| `getUserConversations includes unread_count in response` | Verify unread count computed correctly |
| `getUserConversations includes last_message in response` | Verify last_message field populated |

### `backend/src/__tests__/message.service.test.js`
Update existing tests and add new ones:

| Test | Description |
|------|-------------|
| `createMessage in operator conversation validates sender is driver or operator` | Verify driver and operator can send, others get 403 |
| `createMessage updates last_message on conversation` | Verify conversation's `last_message` and `last_message_at` updated after send |
| `createMessage increments unread_count for recipient` | Verify unread count logic |
| `markAsRead resets unread_count for the reader` | Verify count goes to 0 |

### Backend Test Commands
```bash
cd backend && npm test -- --testPathPattern="conversation.service|message.service"
```

## Frontend Tests

### `frontend/src/app/features/driver/messages/messages.component.spec.ts`
Rewrite to cover the new two-panel layout:

| Test | Description |
|------|-------------|
| `renders left panel with conversation list` | Verify `.conv-panel` element exists |
| `renders right panel with empty state when no conversation selected` | Verify empty state message shown |
| `displays conversation groups (Active Cases, Support, Closed)` | Mock conversations data, verify group headers |
| `filter tabs switch active tab` | Click each tab, verify `activeTab` signal changes |
| `search input filters conversations by name` | Type in search, verify filtered list |
| `selecting a conversation loads messages in right panel` | Click conversation, verify chat panel appears |
| `messages display with correct alignment (mine=right, theirs=left)` | Verify CSS classes on message elements |
| `date separators appear between different days` | Mock messages across days, verify separators |
| `case context strip shows for attorney_case conversations` | Select attorney_case conversation, verify strip |
| `case context strip hidden for operator conversations` | Select operator conversation, verify no strip |
| `send button disabled when input is empty` | Verify button disabled state |
| `send button enabled when input has text` | Type text, verify button enabled |
| `typing indicator shows bouncing dots` | Set typingIndicator signal, verify dots visible |
| `unread badge shows correct count` | Mock conversations with unread_count, verify badge |
| `keyboard navigation works on conversation list` | Simulate Enter/Space on conversation items |
| `accessibility: conversation list has role=list` | Verify ARIA attributes |
| `accessibility: messages area has role=log aria-live=polite` | Verify ARIA attributes |

### `frontend/src/app/features/driver/messages/messaging.service.spec.ts`
Update or create service tests:

| Test | Description |
|------|-------------|
| `getConversations calls correct API endpoint` | Verify HTTP call |
| `getConversations returns typed Conversation[]` | Verify response mapping |
| `getMessages calls correct API endpoint with conversationId` | Verify HTTP call |
| `sendMessage posts to correct endpoint` | Verify HTTP call and body |
| `sendMessage includes message_type in request` | Verify field included |
| `markAsRead calls PATCH endpoint` | Verify HTTP call |

### Frontend Test Commands
```bash
cd frontend && npx ng test --no-watch
```

## Acceptance Criteria
- [ ] All existing backend tests continue to pass (344+ tests)
- [ ] New backend conversation service tests pass (7+ new tests)
- [ ] New backend message service tests pass (4+ new tests)
- [ ] Frontend messages component spec rewritten and passing (17+ tests)
- [ ] Frontend messaging service spec passing (6+ tests)
- [ ] No regressions in other test suites
- [ ] `npx ng test --no-watch` exits 0
- [ ] `cd backend && npm test` exits 0 (excluding pre-existing 3 failures)

## Files to Modify
- `backend/src/__tests__/conversation.service.test.js`
- `backend/src/__tests__/message.service.test.js`
- `frontend/src/app/features/driver/messages/messages.component.spec.ts`
- `frontend/src/app/features/driver/messages/messaging.service.spec.ts` (create if not exists)
