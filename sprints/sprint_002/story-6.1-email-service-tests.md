# Story 6.1 — Tests: email.service.js

**Epic:** Backend Test Coverage
**Priority:** HIGH
**Status:** DONE

## User Story
As a developer,
I want unit tests for the email service,
so that SendGrid integration failures and missing env vars are caught before deploy.

## Scope
- `sendRegistrationEmail` — driver CTA, carrier CTA, SendGrid failure, no API key
- File: `backend/src/__tests__/email.service.test.js`

## Acceptance Criteria
- [x] Driver welcome email contains "Submit Your First Ticket" CTA
- [x] Carrier welcome email contains "Add Your First Driver" CTA
- [x] SendGrid network failure does not throw (non-blocking)
- [x] No email sent when SENDGRID_API_KEY is absent
