# Story V1-1 — Payment Plans Backend (Stripe Subscriptions)

**Sprint:** 027 — V1 First Revenue
**Priority:** CRITICAL
**Status:** TODO

## User Story

As Miguel (driver),
I want to split my attorney fee into 2, 4, or 8 weekly installments,
so I don't have to pay the full amount upfront and can afford better representation.

## Scope

Backend service and API endpoints for payment plan creation, management, and auto-charge via Stripe Subscriptions.

## API Endpoints to Create

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/cases/:id/payment-plans` | driver | Create a payment plan for a case |
| `GET` | `/api/cases/:id/payment-plans` | driver | Get active plan for a case |
| `PATCH` | `/api/cases/:id/payment-plans/:planId` | driver | Modify plan (pause, cancel) |
| `POST` | `/api/webhooks/stripe` | none | Handle Stripe subscription events |
| `GET` | `/api/payments/plans/config` | driver | Get available plan options (2/4/8 weeks, fee) |

## Service: `backend/src/services/payment-plan.service.js` — CREATE

```javascript
// Key functions:
createPaymentPlan(caseId, driverId, planType)   // 'biweekly_2' | 'monthly_4' | 'monthly_8'
getActivePlan(caseId, driverId)
cancelPlan(planId, driverId)
handleStripeWebhook(event)                       // invoice.paid, invoice.payment_failed
```

**Stripe objects used:**
- `stripe.customers.create` — create/retrieve Stripe customer per driver
- `stripe.paymentMethods.attach` — attach card from existing PaymentIntent
- `stripe.subscriptions.create` — create subscription with `billing_cycle_anchor`
- `stripe.webhooks.constructEvent` — validate webhook signature

## Database Changes

New table: `payment_plans`
```sql
CREATE TABLE payment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) NOT NULL,
  driver_id UUID REFERENCES users(id) NOT NULL,
  stripe_subscription_id TEXT NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('biweekly_2', 'monthly_4', 'monthly_8')),
  total_amount DECIMAL(10,2) NOT NULL,
  installment_amount DECIMAL(10,2) NOT NULL,
  installments_paid INTEGER DEFAULT 0,
  installments_total INTEGER NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "driver_own_plans" ON payment_plans
  FOR ALL USING (driver_id = auth.uid());
```

Migration file: `backend/src/migrations/add_payment_plans_table.sql`

## Acceptance Criteria

- [ ] `POST /api/cases/:id/payment-plans` creates Stripe subscription and saves to DB
- [ ] Stripe webhook `invoice.paid` increments `installments_paid`, marks `completed` when all paid
- [ ] Stripe webhook `invoice.payment_failed` updates plan status + triggers email notification
- [ ] `GET /api/payments/plans/config` returns available options with calculated installment amounts
- [ ] Webhook endpoint validates Stripe signature — rejects invalid signatures with 400
- [ ] All endpoints protected by `verifyToken` middleware (except webhook)
- [ ] RLS policy: drivers can only see their own plans

## Files to Create

- `backend/src/services/payment-plan.service.js`
- `backend/src/controllers/payment-plan.controller.js`
- `backend/src/routes/payment-plan.routes.js`
- `backend/src/migrations/add_payment_plans_table.sql`
- `backend/src/__tests__/payment-plan.service.test.js`

## Test Coverage Matrix

| Source File | Test File | Status |
|---|---|---|
| `payment-plan.service.js` | `payment-plan.service.test.js` | ❌ create |
| `payment-plan.controller.js` | `payment-plan.service.test.js` | ❌ create |
