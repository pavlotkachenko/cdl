# Story MSG-3: Backend — Update Message Service for Operator Conversations

## Status: DONE

## Description
Update `message.service.js` to support sending messages in operator/support conversations. When a message is sent, update the conversation's `last_message` column with preview text.

## Changes Required

### message.service.js
1. **`createMessage`** — Update auth check:
   - Current: checks `conversation.driver_id` and `conversation.attorney_id`
   - New: also check `conversation.operator_id` for operator conversations
   - After creating message, update `conversations.last_message` with truncated content (first 100 chars)

2. **`createMessageWithFile`** — Same operator_id auth check

3. **`markAsRead`** — No changes needed (already checks recipient_id)

### message.controller.js
- Minimal changes: the sendMessage controller already passes `senderId: req.user.id` and the service handles the rest

## Acceptance Criteria
- [ ] Messages can be sent in operator conversations (not just attorney ones)
- [ ] `conversations.last_message` is updated when a new message is sent
- [ ] Authorization check includes operator_id for operator conversations
- [ ] All existing message tests pass after changes

## Files to Modify
- `backend/src/services/message.service.js`
- `backend/src/__tests__/message.service.test.js`
