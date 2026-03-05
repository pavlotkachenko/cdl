# Story 5.1 — Registration Confirmation Email

**Epic:** Transactional Email Notifications
**Priority:** MEDIUM (should-have)
**Status:** DONE

## User Story
As a new driver or carrier,
I want to receive a confirmation email after signing up,
so that I have proof of account creation and next-step guidance.

## Scope
- SendGrid integration (SENDGRID_API_KEY in .env)
- Trigger: `POST /api/auth/register` success
- Driver email: "Welcome" + "Submit Your First Ticket" CTA
- Carrier email: "Welcome" + "Add Your First Driver" CTA
- Use existing `template.service.js`
- Non-blocking: registration succeeds even if email fails

## Acceptance Criteria
- [ ] Registration email arrives within 2 minutes of sign-up
- [ ] Email contains user's name and correct role-specific CTA
- [ ] If SendGrid fails, registration still returns 201
- [ ] Unit test: `sendRegistrationEmail()` called with correct params on register success
