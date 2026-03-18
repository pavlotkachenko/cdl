# Sprint 058 — Driver Messaging Overhaul: Multi-Party Chat & Redesign

## Goal
Redesign the driver Messages page with a professional two-panel layout (conversation list + chat panel) and enable drivers to communicate with multiple attorneys AND operators. Seed realistic test data for visual verification.

## Context
The current driver Messages component uses a single-column mobile-style layout with basic Material Design. The user has provided a detailed HTML template showing the target UI: a Slack/iMessage-style two-panel messaging interface with conversation grouping, role-based avatars, case context strips, typing indicators, and rich message bubbles. Additionally, the backend currently only supports driver-attorney conversations; support for driver-operator and driver-support conversations is required.

## Key Design Decisions
- **Two-panel layout**: Left = conversation list (320px), Right = active chat thread (flex)
- **No Angular Material for layout**: The new design uses custom CSS matching the provided HTML template. Angular Material is only used for forms and accessibility utilities.
- **Conversation types**: `attorney_case` (linked to a case), `operator` (case coordinator), `support` (general help)
- **Conversation grouping**: Active Cases, Support & Operations, Closed Cases
- **Filter tabs**: All, Attorneys, Support, Unread
- **Role-based avatar colors**: Attorney=blue, Operator=purple, Support=amber, System=gray
- **Online status**: Visual dots (green/amber/gray) — display only, not real-time tracked yet
- **Case context strip**: Shown in chat header when conversation is linked to a case

## Stories

| # | Story | Priority | Status |
|---|-------|----------|--------|
| MSG-1 | DB Migration: Add conversation_type and last_message columns | P0 | TODO |
| MSG-2 | Backend: Update conversation service for multi-party support | P0 | TODO |
| MSG-3 | Backend: Update message service for operator conversations | P0 | TODO |
| MSG-4 | Backend: Seed test data (5+ conversations, 20+ messages) | P0 | TODO |
| MSG-5 | Frontend: Redesign MessagingService types for new features | P1 | TODO |
| MSG-6 | Frontend: Rewrite messages.component.ts with two-panel layout | P0 | TODO |
| MSG-7 | Frontend: Implement conversation filtering and search | P1 | TODO |
| MSG-8 | Backend + Frontend: Unit test updates | P1 | TODO |

## Acceptance Criteria Summary
- [ ] Driver can see conversations grouped by Active Cases, Support & Operations, Closed Cases
- [ ] Driver can filter conversations: All, Attorneys, Support, Unread
- [ ] Driver can search conversations by name
- [ ] Driver can chat with attorneys (existing) AND operators (new)
- [ ] Each conversation shows role-based avatar color (blue=attorney, purple=operator, amber=support)
- [ ] Active chat shows case context strip with case number, violation type, and status
- [ ] Messages display with sender name, role badge, and avatar
- [ ] Date separators appear between message groups from different days
- [ ] Typing indicator animation works
- [ ] Send area shows encryption note and toolbar icons
- [ ] At least 5 test conversations with 20+ messages are seeded and visible
- [ ] All existing backend tests pass (conversation.service, message.service)
- [ ] Frontend messages.component.spec.ts updated and passing
- [ ] No regressions in other test suites
