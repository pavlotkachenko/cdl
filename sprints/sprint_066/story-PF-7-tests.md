# Story: PF-7 — Frontend — Tests Update

**Sprint:** sprint_066
**Priority:** P0
**Status:** DONE

## User Story

As a developer,
I want comprehensive test coverage for the redesigned payment page,
So that regressions are caught automatically when future changes are made.

## Scope

### Files to Modify
- `frontend/src/app/features/driver/case-payment/case-payment.component.spec.ts`

### Implementation

Rewrite the spec file to cover the redesigned component. The test setup needs:

#### Test Setup
```typescript
function setup(overrides?: { caseResponse?: any; planResponse?: any; stripeConfigResponse?: any }) {
  // Mock HttpClient, ActivatedRoute, Router
  // Mock Stripe SDK as null (no real Stripe in tests)
  // Provide default case response with attorney stats
  // Provide default plan options response
}
```

#### Mock Data
```typescript
const MOCK_CASE = {
  case: {
    id: 'case-1',
    case_number: 'CASE-2026-000847',
    violation_type: 'speeding',
    court_date: '2026-04-15',
    court_location: 'I-35 North, Texas',
    attorney_price: 450,
    status: 'in_progress',
    attorney: {
      full_name: 'James Wilson',
      win_rate: 97,
      years_experience: 12,
      cases_won: 340
    }
  }
};

const MOCK_PLAN_OPTIONS = {
  data: {
    payNow: { amount: 450 },
    fourWeek: { weeklyAmount: 112.50 },
    eightWeek: { weeklyAmount: 56.25 }
  }
};
```

### Test Cases Required

#### Page Structure (PF-1)
1. Renders page header with "Secure Checkout" label and "Pay Attorney Fee" title
2. Shows back button that navigates to case detail
3. Loading state shows CSS spinner (no mat-spinner)
4. Two-column layout renders after case loads

#### Case Summary (PF-2)
5. Case summary card shows case number as teal-styled link
6. Violation row shows violation type with location
7. Attorney row shows initials avatar and name
8. Status row shows status badge and court date
9. Missing fields are gracefully hidden

#### Payment Options (PF-3)
10. Renders two payment option cards (Pay in Full, Payment Plan)
11. "Pay in Full" selected by default — no, actually check what the component defaults to
12. Clicking "Payment Plan" reveals schedule section
13. Clicking "Pay in Full" hides schedule section
14. Payment plan card shows "Most Popular" badge
15. Schedule shows correct number of installment rows with dates and amounts

#### Card Form (PF-4)
16. Card form shows cardholder name input
17. Card form has three Stripe element mount points (card number, expiry, CVC)
18. Card brand strip shows VISA, MC, AMEX
19. Stripe security badge text is present
20. Pay button shows correct amount for full payment
21. Pay button shows first installment amount for payment plan
22. Pay button disabled when Stripe not ready
23. Pay button shows "Processing..." during payment

#### Sidebar (PF-5)
24. Order summary shows attorney fee line item
25. Order summary shows "Free" for processing fee
26. Order summary total matches selected plan amount
27. Attorney card shows name, initials, and stats
28. Trust badges section renders 4 items

#### Design & A11y (PF-6)
29. No MatProgressSpinnerModule in component
30. No MatSnackBar injected
31. Payment options container has role="radiogroup"
32. Error messages have role="alert"
33. Pay button has aria-label with amount

#### Payment Flow (existing, preserved)
34. Full payment: calls confirmCardPayment with cardholder name in billing_details
35. Full payment success: navigates to payment-success page
36. Full payment error: shows inline error (no snackbar)
37. Plan payment: calls createPaymentMethod then POST /payments/create-plan
38. Plan payment error: shows inline error

## Acceptance Criteria

- [ ] All 38 test cases implemented and passing
- [ ] Test file uses Angular TestBed with `provideHttpClient()` + `provideHttpClientTesting()`
- [ ] Stripe SDK mocked as null (no real Stripe calls in tests)
- [ ] No `MatSnackBar` or `MatProgressSpinnerModule` in test providers
- [ ] `cd frontend && npx ng test --no-watch` passes with no new failures

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `case-payment.component.ts` | `case-payment.component.spec.ts` | rewrite |

## Dependencies

- Depends on: PF-2, PF-3, PF-4, PF-5, PF-6 (all component changes must be done first)
- Blocked by: none

## Notes

- The current spec file has partial coverage. This story fully rewrites it to cover the redesigned component.
- Stripe Elements cannot be tested directly (SDK not loaded in test environment). Test that mount points exist in DOM and that the component handles `stripeReady` signal correctly.
- For payment flow tests: mock the `stripe` private property to simulate `confirmCardPayment` and `createPaymentMethod` responses.
