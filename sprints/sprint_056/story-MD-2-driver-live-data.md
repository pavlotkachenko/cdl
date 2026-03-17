# MD-2: Driver: migrate messages and notifications to live API data

**Status:** TODO
**Priority:** P0
**Dependencies:** MD-1

## Description
Replace hardcoded mock conversations and message threads in the driver messaging component with real API calls. Remove the mock messaging service. Wire notifications to the real notification service. The mock messaging service currently simulates incoming messages every 15 seconds and auto-generates fake attorney responses -- all of this must be removed from production code.

## Acceptance Criteria

- [ ] messages.component.ts: getMockConversations() removed -- conversations loaded from GET /api/conversations
- [ ] messages.component.ts: getMockMessages() removed -- messages loaded from GET /api/conversations/:id/messages
- [ ] Empty state shown when driver has no conversations ("No messages yet")
- [ ] SkeletonLoader shown while conversations/messages are loading
- [ ] ErrorState shown with retry button when API call fails (no silent fallback to mocks)
- [ ] messaging.service.mock.ts: deprecated or deleted (mock data moved to spec files only)
- [ ] simulateIncomingMessages() and simulateResponse() removed from production code
- [ ] Real-time message updates via existing Socket.io connection
- [ ] Co-located spec file updated to use mock data from test fixtures, not production constants
- [ ] No mock user names (James Wilson, Sarah Chen, Michael Torres) appear in production

## Files

- `frontend/src/app/features/driver/messages/messages.component.ts`
- `frontend/src/app/features/driver/services/messaging.service.mock.ts`
- `frontend/src/app/features/driver/messages/messages.component.spec.ts`

## Technical Notes

- The mock service has ~400 lines of simulated messaging logic (lines ~32-431) that needs to be replaced with real service calls
- Conversations should be loaded on component init and refreshed via Socket.io events
- Message threads should lazy-load when a conversation is selected
- The 15-second fake incoming message timer must be completely removed
- Mock data constants (fake conversations, message threads) should be preserved in the .spec.ts file for unit testing
