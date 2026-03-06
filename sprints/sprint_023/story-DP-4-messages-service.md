# Story DP-4 — Frontend: Modernize MessagingService

**Epic:** Driver Portal Modernization
**Sprint:** 023
**Priority:** HIGH
**Status:** DONE

## User Story

As a developer, I want a clean Angular 21 messaging service that wraps the conversations/messages API and provides Socket.io real-time subjects.

## Acceptance Criteria

- [ ] `MessagingService` moved to `core/services/messaging.service.ts` (new file, not replacing old)
- [ ] Uses inject(HttpClient), inject(AuthService), providedIn: 'root'
- [ ] Methods: getConversations(), getMessages(id), sendMessage(convId, content), markAsRead(convId)
- [ ] Socket subjects: newMessage$, typing$ (BehaviorSubject or Subject)
- [ ] Socket init is lazy (called once on first use), graceful no-op if socket.io unavailable
- [ ] Service spec with 4 tests covering HTTP methods

## Files to Create / Modify

- `frontend/src/app/core/services/messaging.service.ts` — NEW
- `frontend/src/app/core/services/messaging.service.spec.ts` — NEW
