# Story V1-2 — Payment Plans Frontend UI

**Sprint:** 027 — V1 First Revenue
**Priority:** CRITICAL
**Status:** TODO

## User Story

As Miguel (driver),
I want to choose between paying in full or splitting into installments on the payment screen,
so I can pick what fits my budget in under 5 seconds.

## Prerequisites

V1-1 (payment plans backend) must be complete.

## Scope

Add a plan-selector step to the existing `CasePaymentComponent` and create a plan-status view on the case detail page.

## UI Changes

### `case-payment.component.ts` — UPDATED

Add plan selector before the card entry step:

```
Step 1: Choose payment option
  ┌─────────────────────────────────────────┐
  │  ○ Pay in full   $850.00               │
  │  ○ 2 payments    $425.00 / week        │
  │  ○ 4 payments    $212.50 / week        │
  │  ○ 8 payments    $106.25 / week        │
  └─────────────────────────────────────────┘
  [ Continue to Payment ]

Step 2: Enter card (existing Stripe element)
```

**New signals:**
- `selectedPlan = signal<'full' | 'biweekly_2' | 'monthly_4' | 'monthly_8'>('full')`
- `planOptions = signal<PlanOption[]>([])`
- `loadingPlans = signal(false)`

**New methods:**
- `loadPlanOptions()` — calls `GET /api/payments/plans/config`, populates `planOptions`
- `selectPlan(type)` — updates `selectedPlan` signal
- `submitPayment()` — branches: full payment (existing flow) vs plan creation (calls `POST /api/cases/:id/payment-plans`)

### `case-detail.component.ts` — UPDATED

Add payment plan status card when `activePlan` signal is set:
```
Payment Plan: Active
  Paid: 2 of 4 installments  ($425 of $850)
  Next charge: April 12, 2026
  [ Cancel Plan ]
```

### New Interface in `frontend/src/app/services/payment.service.ts`

```typescript
export interface PlanOption {
  type: 'biweekly_2' | 'monthly_4' | 'monthly_8';
  label: string;           // "2 payments"
  installmentAmount: number;
  totalAmount: number;
  intervalLabel: string;   // "per week"
}
```

## Acceptance Criteria

- [ ] Plan selector renders 4 options (full + 3 installment plans) with correct amounts
- [ ] Selected plan highlighted with mat-radio + border accent
- [ ] "Pay in full" pre-selected by default
- [ ] Continue button disabled until a plan is selected
- [ ] Plan installment amounts calculated from case fee (not hardcoded)
- [ ] On installment plan: calls `POST /api/cases/:id/payment-plans` instead of `confirmCardPayment`
- [ ] Success navigates to payment-success with plan summary in state
- [ ] Case detail shows active plan card with progress (2 of 4 paid)
- [ ] Mobile: plan cards stack vertically, full-width touch targets ≥ 44px
- [ ] 3-click rule: plan select → card entry → pay = 3 user actions

## Files to Create / Modify

- `frontend/src/app/features/driver/case-payment/case-payment.component.ts` — UPDATED
- `frontend/src/app/features/driver/case-payment/case-payment.component.html` — UPDATED
- `frontend/src/app/features/driver/case-detail/case-detail.component.ts` — UPDATED
- `frontend/src/app/services/payment.service.ts` — UPDATED (add `getPlanOptions`, `createPaymentPlan`)
- `frontend/src/app/features/driver/case-payment/case-payment.component.spec.ts` — UPDATED
- `frontend/src/app/features/driver/case-detail/case-detail.component.spec.ts` — UPDATED
- `frontend/src/app/services/payment.service.spec.ts` — UPDATED

## Test Coverage Matrix

| Source File | Test File | Status |
|---|---|---|
| `case-payment.component.ts` | `case-payment.component.spec.ts` | ❌ update |
| `case-detail.component.ts` | `case-detail.component.spec.ts` | ❌ update |
| `payment.service.ts` | `payment.service.spec.ts` | ❌ update |
