# Story PP-1 — Payment Plan Backend (Weekly Installments)

**Sprint:** 032 — Payment Plans + Auto Re-offer
**Priority:** P0
**Status:** DONE

## User Story

As Miguel (driver),
I want to pay for my case in 2, 4, or 8 weekly installments,
so that I don't have to pay the full amount upfront.

## Scope

### `backend/src/controllers/payment.controller.js` — UPDATED

New functions:
- `getPaymentPlanOptions(req, res)` — returns 3 plan options (2/4/8 week) computed from case `attorney_price`
- `createPaymentPlan(req, res)` — creates first Stripe PaymentIntent + inserts row in `payment_plan_installments`, schedules future installments in `payment_plan_notifications`
- `processScheduledInstallments(req, res)` — internal endpoint (cron trigger) to charge overdue installments

### `backend/src/routes/payment.routes.js` — UPDATED

New routes:
- `GET /api/payments/plan-options/:caseId` — returns 3 plan objects
- `POST /api/payments/create-plan` — creates plan + first charge
- `POST /api/payments/process-installments` — cron-only, protected by secret header

### `backend/src/migrations/013_case_installment_plans.sql` — CREATED

New table `case_installment_plans` (separate from existing 012 `payment_plans` which covers subscriptions):
- `id`, `case_id`, `user_id`, `total_amount`, `weeks` (2/4/8), `weekly_amount`, `status`
- `case_installment_schedule`: `plan_id`, `installment_num`, `amount`, `due_date`, `status`, `stripe_payment_intent_id`

## Acceptance Criteria

- [x] `GET /api/payments/plan-options/:caseId` returns `{ payNow, twoWeek, fourWeek, eightWeek }` with computed amounts
- [x] `POST /api/payments/create-plan` charges first installment immediately via Stripe, schedules rest
- [x] Plan status: `active` → `completed` when all installments paid, `failed` after 3 retries
- [x] Subsequent installments stored with `due_date` (7/14/21/28/35/42/49 days from today)
- [x] Existing lump-sum `POST /api/payments/create-intent` unchanged

## Test Coverage Matrix

| Source File | Test File | Status |
|---|---|---|
| `payment.controller.js` (plan functions) | `payment.plan.test.js` | DONE |
