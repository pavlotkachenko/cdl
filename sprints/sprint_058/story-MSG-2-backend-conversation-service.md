# Story MSG-2: Backend — Update Conversation Service for Multi-Party Support

## Status: DONE

## Description
Update `conversation.service.js` to support the new conversation types (attorney_case, operator, support). Add query parameters for filtering by type. Update hydration to handle operator participants. Add unread count computation.

## Changes Required

### conversation.service.js
1. **`getUserConversations(userId, options)`** — Add filtering support:
   - `options.type` — filter by conversation_type ('attorney_case' | 'operator' | 'support')
   - `options.unreadOnly` — filter to conversations with unread messages for this user
   - `options.search` — filter by other party name (case-insensitive)
   - Compute `unread_count` per conversation by counting unread messages where recipient_id = user's auth ID
   - Include `last_message` from the DB column
   - Support `operator_id` field in hydration (look up operator user from public.users by auth_user_id)

2. **`hydrateConversations(conversations)`** — Update to:
   - Also resolve `operator_id` to user profile data
   - Add `other_party` field to each conversation (the non-driver participant — attorney or operator)
   - Include `conversation_type` in response

3. **`createConversation(params)`** — Accept new params:
   - `conversationType` — default `'attorney_case'`
   - `operatorId` — for operator conversations (instead of attorneyId)
   - Skip attorney assignment checks for non-attorney conversations

4. **New function: `getUnreadCountForUser(userId)`** — Return total unread message count across all conversations for sidebar badge

### conversation.controller.js
1. **`getConversations`** — Accept query params: `?type=attorney_case&unread=true&search=james`
2. **`createConversation`** — Accept `conversationType` and `operatorId` in body

### conversation.routes.js
- No route changes needed (existing routes accept query params and body params)

## API Contract

### GET /api/conversations
Query params:
- `type` (optional): `'attorney_case' | 'operator' | 'support' | 'all'`
- `unread` (optional): `'true'` — only conversations with unread messages
- `search` (optional): string — search other party name

Response shape (unchanged):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "case_id": "uuid | null",
      "driver_id": "public-user-id",
      "attorney_id": "public-user-id | null",
      "operator_id": "public-user-id | null",
      "conversation_type": "attorney_case | operator | support",
      "last_message": "preview text...",
      "last_message_at": "iso-date",
      "unread_count": 2,
      "driver": { "id": "...", "name": "...", "email": "..." },
      "attorney": { "id": "...", "name": "...", "email": "..." } | null,
      "operator": { "id": "...", "name": "...", "email": "..." } | null,
      "case": { "id": "...", "case_number": "...", "status": "..." } | null,
      "closed_at": null
    }
  ],
  "pagination": { ... }
}
```

## Acceptance Criteria
- [ ] `getUserConversations` supports `type`, `unreadOnly`, and `search` filters
- [ ] Each conversation in the response includes `unread_count` (computed)
- [ ] Operator conversations hydrate `operator` field with user profile
- [ ] `conversation_type` is included in every response
- [ ] `last_message` is included from DB column
- [ ] `createConversation` supports creating operator conversations
- [ ] All existing tests still pass after changes

## Files to Modify
- `backend/src/services/conversation.service.js`
- `backend/src/controllers/conversation.controller.js`
- `backend/src/__tests__/conversation.service.test.js`
