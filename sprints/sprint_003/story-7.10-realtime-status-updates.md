# Story 7.10 — Real-time Case Status Updates via Socket.io

**Epic:** Core Flow Integration
**Priority:** MEDIUM
**Status:** TODO

## User Story
As Miguel (driver) and James (attorney),
I want case status changes to appear instantly without refreshing the page,
so that I know the moment something changes.

## Context
Socket.io 4.8 is in the tech stack. `socket/` folder exists in the backend.
`workflow.service.js` → `updateCaseStatus` fires after every status change but does not yet
emit a Socket.io event. Story 7.3 (driver case status page) subscribes to `case:{caseId}` room
but the backend does not yet emit to it.

## Scope

### Backend (`backend/src/socket/`)
- On `updateCaseStatus` success in `workflow.service.js`: emit `case:status_updated` to room `case:{caseId}`
  - Payload: `{ caseId, newStatus, previousStatus, updatedAt }`
- On `createMessage` success in `message.service.js`: emit `conversation:new_message` to room `conv:{conversationId}`
  - Payload: `{ messageId, conversationId, senderId, preview (first 100 chars) }`
- Socket.io auth middleware: verify JWT on `connection` handshake; disconnect unauthenticated sockets
- Room join: client emits `join:case` with `{ caseId }` → server verifies user belongs to case before adding to room

### Frontend — Angular Socket.io service

**`SocketService` (singleton, `core/services/socket.service.ts`):**
```typescript
connect(token: string): void        // handshake with JWT
disconnect(): void
joinCase(caseId: string): void
leaveCase(caseId: string): void
onCaseStatusUpdate(): Observable<CaseStatusEvent>
onNewMessage(): Observable<MessageEvent>
```

**Driver case status page (Story 7.3 integration):**
- On mount: `socketService.joinCase(caseId)`
- Subscribe to `onCaseStatusUpdate()` → update status signal in component
- On destroy: `socketService.leaveCase(caseId)` + unsubscribe

**Attorney dashboard (Story 7.6 integration):**
- Subscribe to `onCaseStatusUpdate()` for all active cases
- On new status: update case card badge/status without refetch

**Notification badge:**
- Any `case:status_updated` event where driver is not currently on the case page → increment notification badge count in the top nav (stored in a `NotificationCountService` signal)

## Acceptance Criteria
- [ ] When operator or attorney updates case status, driver's case page reflects new status within 2 seconds (no page refresh)
- [ ] Socket.io connections are authenticated — unauthenticated connections are rejected
- [ ] Client can only join rooms for cases they are a party to (driver/attorney of that case)
- [ ] `SocketService` disconnects cleanly on user logout
- [ ] New message event updates notification badge count on pages other than the active conversation
- [ ] Angular `OnPush` components correctly re-render when signal updated from socket event
- [ ] No memory leaks: subscriptions unsubscribed on component destroy
