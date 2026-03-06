# Story PP-3 — SMS Payment Reminder Cron Job

**Sprint:** 032 — Payment Plans + Auto Re-offer
**Priority:** P1
**Status:** DONE

## User Story

As Miguel (driver),
I want to receive an SMS 2 days before each installment is due,
so I can ensure my card has sufficient funds and I don't miss a payment.

## Scope

### `backend/src/services/sms.service.js` — UPDATED

New function:
- `sendPaymentReminderSms(phone, amount, dueDate, installmentNum, totalInstallments)` — sends Twilio SMS: "Reminder: Payment #2 of 4 ($74.75) is due on [date]. Reply STOP to opt out."

### `backend/src/jobs/payment-reminders.job.js` — CREATED

- Cron job (runs daily at 9am): queries `case_installment_schedule` for installments where `due_date = TODAY + 2 days` AND `status = 'pending'` AND `reminder_sent = false`
- For each: fetches user phone, calls `sms.service.sendPaymentReminderSms()`
- Marks `reminder_sent = true`

### `backend/src/app.js` / `backend/src/server.js` — UPDATED

- Register cron job on server startup using `node-cron` (`0 9 * * *`)

### `backend/src/migrations/013_case_installment_plans.sql` — UPDATED

- `case_installment_schedule.reminder_sent BOOLEAN DEFAULT FALSE`

## Acceptance Criteria

- [x] SMS sent exactly 2 days before each installment (not the first — already paid)
- [x] SMS not sent twice (reminder_sent flag)
- [x] SMS contains: amount, due date, installment number/total
- [x] Quiet hours not a concern (sends at 9am user local time — simplified: UTC 9am for MVP)

## Test Coverage Matrix

| Source File | Test File | Status |
|---|---|---|
| `sms.service.js` (sendPaymentReminderSms) | `sms.service.test.js` | DONE |
| `payment-reminders.job.js` | `payment-reminders.job.test.js` | DONE |
