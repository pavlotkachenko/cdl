# Story V1-3 — SMS/Twilio Lifecycle Notifications

**Sprint:** 027 — V1 First Revenue
**Priority:** HIGH
**Status:** TODO

## User Story

As Miguel (driver),
I want to receive an SMS when my case status changes, my attorney is assigned, and my payment is due,
so I always know what's happening without having to log in and check.

## Context

Twilio is listed as a project dependency in `docs/06_TECHNICAL_REQUIREMENTS.md` and `CLAUDE.md`. Email notifications exist (Sprint 001 + LH-2). SMS is Miguel's **primary** channel per `docs/03_BUSINESS_REQUIREMENTS.md` §1.1 and `docs/04_FUNCTIONAL_REQUIREMENTS.md` §4.4 AC4.

## Prerequisites

- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` in `.env`

## Backend Changes

### `backend/src/services/sms.service.js` — CREATE

```javascript
// Key functions:
sendSms(toPhoneNumber, message)                  // base Twilio client wrapper
sendCaseAssignedSms(driver)                      // "Your attorney {name} has accepted your case."
sendCaseStatusUpdateSms(driver, newStatus)       // "Your case status changed to: {status}"
sendPaymentReminderSms(driver, amount, dueDate)  // "Payment of ${amount} is due on {date}."
sendCourtDateReminderSms(driver, courtDate)      // "Court date reminder: {date} at {location}."
sendPaymentPlanChargeSms(driver, amount, nth, total) // "Installment {nth}/{total} of ${amount} charged."
```

### `backend/src/controllers/case.controller.js` — UPDATED

Wire SMS triggers (non-blocking, same pattern as email):
- `assignToAttorney`: trigger `sendCaseAssignedSms`
- `updateCaseStatus`: trigger `sendCaseStatusUpdateSms`

### `backend/src/services/payment-plan.service.js` — UPDATED (from V1-1)

Webhook handler `invoice.paid`: trigger `sendPaymentPlanChargeSms`

### `backend/src/services/notification.service.js` — UPDATED

Add court date reminder scheduled check: trigger `sendCourtDateReminderSms` 24 hours before `court_date` (use existing calendar/cron infrastructure from Sprint 001).

## Phone Number Handling

- Drivers provide phone number at registration (`users.phone` column — confirm exists or add migration)
- SMS only sent if `user.phone` is non-null and consent flag `sms_notifications_enabled = true`
- Default: `sms_notifications_enabled = true` for new drivers

## Acceptance Criteria

- [ ] `sendSms` gracefully handles Twilio errors — logs error, does not throw (non-blocking)
- [ ] Case assigned → driver receives SMS within 5 seconds
- [ ] Case status change → driver receives SMS
- [ ] Payment plan installment charged → driver receives SMS
- [ ] Court date 24h reminder sends via existing cron mechanism
- [ ] No SMS sent if `phone` is null or `sms_notifications_enabled = false`
- [ ] SMS content is concise (< 160 chars) and includes case reference number

## Files to Create / Modify

- `backend/src/services/sms.service.js` — CREATE
- `backend/src/controllers/case.controller.js` — UPDATE
- `backend/src/services/payment-plan.service.js` — UPDATE (V1-1 dependency)
- `backend/src/services/notification.service.js` — UPDATE
- `backend/src/__tests__/sms.service.test.js` — CREATE

## Test Coverage Matrix

| Source File | Test File | Status |
|---|---|---|
| `sms.service.js` | `sms.service.test.js` | ❌ create |
| `case.controller.js` (SMS triggers) | `case.controller.test.js` | ❌ update |
