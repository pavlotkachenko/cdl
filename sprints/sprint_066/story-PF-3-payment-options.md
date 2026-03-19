# Story: PF-3 — Frontend — Payment Option Cards & Schedule

**Sprint:** sprint_066
**Priority:** P0
**Status:** DONE

## User Story

As Miguel (Driver),
I want to choose between paying in full or a payment plan with a clear visual comparison,
So that I can pick the option that fits my budget and see exactly when each payment is due.

## Scope

### Files to Modify
- `frontend/src/app/features/driver/case-payment/case-payment.component.html`
- `frontend/src/app/features/driver/case-payment/case-payment.component.scss`
- `frontend/src/app/features/driver/case-payment/case-payment.component.ts`

### Implementation

#### Payment Option Cards
Replace the current vertical list of 4 radio options with 2 side-by-side selectable cards:

1. **"Pay in Full"** card
   - Radio circle (custom styled, teal when selected)
   - Title: "Pay in Full"
   - Description: "Single payment of $450.00 today. No installment fees."
   - No badge

2. **"Payment Plan"** card
   - Radio circle (custom styled, teal when selected)
   - Title: "Payment Plan"
   - Description: "Split into N weekly payments of $X.XX."
   - Badge: "Most Popular" with star emoji, teal background

Cards are `display: flex; gap: 10px` in `.payment-options` container. Each card has:
- 1.5px border (teal when selected, plus 3px teal box-shadow ring)
- Teal background tint when selected
- `cursor: pointer`, hover border change

#### Payment Schedule (Revealed)
When "Payment Plan" is selected, reveal a `.plan-schedule` section below the cards:
- Title: "PAYMENT SCHEDULE" (uppercase, muted)
- Rows for each installment:
  - Circle number (first = teal gradient with "Due now" badge, rest = teal-bordered)
  - Date (e.g., "Today — Mar 19, 2026")
  - Amount (e.g., "$150.00")
- Data comes from computed signal based on `planOptions()` — generate dates starting from today, weekly intervals

#### Signal Changes
- Change `selectedPlan` type from `'full' | '2' | '4' | '8'` to `'full' | 'plan'`
- Add `defaultPlanWeeks = computed(() => ...)` — picks the "popular" plan from `planOptions()` (default 4 weeks)
- Add `planSchedulePreview = computed(() => ...)` — generates schedule rows from selected plan option
- The actual Stripe plan creation still uses the numeric weeks value from the selected plan option

#### Backward Compatibility
The `pay()` method currently checks `selectedPlan() === 'full'` vs numeric plan key. Update to:
- `'full'` → same full payment flow
- `'plan'` → use `defaultPlanWeeks()` to get the weeks value, then same installment flow

## Acceptance Criteria

- [ ] Two side-by-side cards: "Pay in Full" and "Payment Plan"
- [ ] Custom radio circles (teal fill when selected)
- [ ] Selected card has teal border + teal background tint + box-shadow ring
- [ ] "Payment Plan" card shows "Most Popular" badge with star emoji
- [ ] Payment plan description shows weekly amount and number of payments from API data
- [ ] Selecting "Payment Plan" reveals payment schedule section with animated transition
- [ ] Schedule shows installment rows with circle numbers, dates, and amounts
- [ ] First installment has "Due now" badge and filled teal circle
- [ ] Schedule dates are weekly from today
- [ ] Selecting "Pay in Full" hides the schedule section
- [ ] `role="radiogroup"` on container, `aria-label` on each option
- [ ] Keyboard navigable: arrow keys switch selection

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `case-payment.component.ts` | `case-payment.component.spec.ts` | defer to PF-7 |

## Dependencies

- Depends on: PF-1 (layout structure)
- Blocked by: none

## Notes

- The plan options API returns Full/4wk/8wk. For the 2-card design, we present the most popular plan (4wk) as the single "Payment Plan" option. If the user wants 8wk, that's a future enhancement.
- The schedule preview is for display only — actual schedule is created by the backend on `POST /payments/create-plan`.
- Plan description text should dynamically use values from `planOptions()` (e.g., "Split into 4 weekly payments of $112.50").
