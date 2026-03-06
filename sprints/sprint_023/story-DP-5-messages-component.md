# Story DP-5 — Frontend: Rewrite Messages Component

**Epic:** Driver Portal Modernization
**Sprint:** 023
**Priority:** HIGH
**Status:** DONE

## User Story

As a driver, I want to view my conversations and send messages to my attorney in a clean, real-time chat UI.

## Acceptance Criteria

- [ ] Uses Angular 21: inject(), signal(), computed(), OnPush, @if/@for, inline template
- [ ] No CommonModule, no Subject/takeUntil, no OnDestroy, no animations import, no standalone:true
- [ ] Conversation list shows name, last message, unread badge
- [ ] Selecting a conversation loads messages in a thread view
- [ ] Message input + send button at the bottom
- [ ] Real-time: new messages from socket appended to thread
- [ ] Loading/error states for conversation list and message thread
- [ ] Component spec with 8+ tests

## Files to Create / Modify

- `frontend/src/app/features/driver/messages/messages.component.ts` — REWRITE
- `frontend/src/app/features/driver/messages/messages.component.html` — DELETE (inline)
- `frontend/src/app/features/driver/messages/messages.component.scss` — DELETE (inline)
- `frontend/src/app/features/driver/messages/messages.component.spec.ts` — NEW
