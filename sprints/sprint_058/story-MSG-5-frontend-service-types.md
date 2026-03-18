# Story MSG-5: Frontend — Redesign MessagingService Types

## Status: DONE

## Description
Update the `messaging.service.ts` to add types and API methods for the new conversation features: conversation types, operator participants, filtering, search, and unread counts.

## Changes Required

### Updated Type Definitions

```typescript
export type ConversationType = 'attorney_case' | 'operator' | 'support';

export interface Conversation {
  id: string;
  case_id: string | null;
  driver_id: string;
  attorney_id: string | null;
  operator_id: string | null;
  conversation_type: ConversationType;
  driver?: User;
  attorney?: User;
  operator?: User;
  case?: { id: string; case_number: string; status: string; violation_type?: string; location?: string };
  last_message_at?: string;
  last_message?: string;
  unread_count: number;
  closed_at?: string;
  created_at: string;
  updated_at: string;
}
```

### New API Methods
```typescript
getConversations(params?: {
  type?: ConversationType | 'all';
  unread?: boolean;
  search?: string;
}): Observable<ConversationsResponse>
```

### Helper Methods
```typescript
getOtherParty(conv: Conversation): User | null
// Returns attorney, operator, or null based on conversation_type

getConversationTypeLabel(conv: Conversation): string
// Returns "Attorney", "Operations", "General Support"

getConversationTypeIcon(conv: Conversation): string
// Returns emoji icon based on type
```

## Acceptance Criteria
- [ ] `Conversation` interface includes `conversation_type`, `operator_id`, `operator`, `unread_count`
- [ ] `getConversations()` supports optional filter params
- [ ] Helper methods added for UI rendering
- [ ] Existing `sendMessage` and `getMessages` still work
- [ ] No TypeScript compilation errors

## Files to Modify
- `frontend/src/app/features/driver/messages/messaging.service.ts`
