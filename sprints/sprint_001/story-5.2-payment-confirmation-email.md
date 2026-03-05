# Story 5.2 — Payment Confirmation Email

**Epic:** Transactional Email Notifications
**Priority:** MEDIUM (should-have)
**Status:** DONE

## User Story
As a driver who just paid,
I want a payment receipt email,
so that I have proof of payment for my records.

## Scope
- Trigger from `payment.service.js` on successful Stripe charge
- Email contents: amount, last 4 of card, receipt number, attorney name assigned
- Use existing `template.service.js`

## Acceptance Criteria
- [ ] Payment confirmation email arrives within 2 minutes of successful Stripe charge
- [ ] Email includes: amount, last 4 digits of card, transaction ID
- [ ] No email sent if payment fails
- [ ] Unit test: payment service calls `sendPaymentConfirmationEmail()` on success
