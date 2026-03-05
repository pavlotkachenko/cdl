# Story 5.3 — Case Status Change Email

**Epic:** Transactional Email Notifications
**Priority:** MEDIUM (should-have)
**Status:** DONE

## User Story
As a driver whose case status changed,
I want an email notification in addition to in-app/SMS,
so that I don't miss important updates even if push notifications are off.

## Scope
- Trigger from `workflow.service.js` or `case.controller.js` on status update
- Email: plain English status message + next steps
- Only send for driver-visible stage transitions (not internal system transitions)

## Acceptance Criteria
- [ ] Status change email sent within 1 minute of attorney updating status
- [ ] Email uses plain English (no legal jargon)
- [ ] Email not sent for internal/system-only status transitions
- [ ] Unit test: status update triggers `sendStatusChangeEmail()` for correct stages
