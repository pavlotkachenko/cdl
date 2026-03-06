# Story PP-2 — Payment Plan UI (Driver Checkout)

**Sprint:** 032 — Payment Plans + Auto Re-offer
**Priority:** P0
**Status:** DONE

## User Story

As Miguel (driver),
I want to see "Pay Now" vs "Payment Plan" options at checkout with weekly amounts,
so I can choose what works for my budget.

## Scope

### `frontend/src/app/features/driver/case-payment/case-payment.component.ts` — UPDATED

- Load plan options via `GET /api/payments/plan-options/:caseId` on init
- Signals: `planOptions()`, `selectedPlan()` (`'full'|'2w'|'4w'|'8w'`), `loading()`
- Template: radio-button plan cards showing:
  - "Pay Now — $299 total"
  - "2 weeks — $149.50/week × 2 payments" (Most Flexible)
  - "4 weeks — $74.75/week × 4 payments" (**Most Popular** badge)
  - "8 weeks — $37.38/week × 8 payments"
- On submit: if `selectedPlan === 'full'` → existing `createPaymentIntent` flow; else → `POST /api/payments/create-plan`
- After plan created: show installment schedule (dates + amounts) in success screen

### `frontend/src/app/features/driver/case-payment/case-payment.component.html` — UPDATED

Plan selector replaces "Contact support" placeholder text.

## Acceptance Criteria

- [x] Plan options loaded from API (not hardcoded)
- [x] 4-week plan pre-selected by default ("Most Popular")
- [x] Weekly amount rounds to nearest $0.25
- [x] Installment schedule shown on success screen
- [x] "Pay Now" still works as before (existing Stripe Elements flow)
- [x] Loading skeleton shown while fetching plan options

## Test Coverage Matrix

| Source File | Test File | Status |
|---|---|---|
| `case-payment.component.ts` | `case-payment.component.spec.ts` | DONE |
