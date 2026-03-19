# Story: SP-8 — Tests

**Sprint:** sprint_068
**Priority:** P0
**Status:** DONE

## User Story

As a developer,
I want comprehensive unit tests for the redesigned SubscriptionManagementComponent,
So that regressions are caught and all acceptance criteria are verified.

## Scope

### Files to Create
- `frontend/src/app/features/attorney/subscription-management/subscription-management.component.spec.ts`

### Database Changes
- None

## Acceptance Criteria

- [ ] Test file created and all tests pass via `npx ng test --no-watch`
- [ ] **Page structure tests:** loading spinner renders, current plan banner renders, billing toggle renders, plans grid renders, trust row renders, FAQ section renders, footer note renders
- [ ] **Current plan banner tests:** plan name displayed, active badge shown, price and renewal date shown, Manage Billing button calls `openBillingPortal`, Cancel Plan button calls `cancelSubscription`, cancel notice shown when `cancel_at_period_end`, usage stats display, no-subscription state shows fallback message
- [ ] **Billing toggle tests:** monthly is default, clicking toggle switches to annual, plan prices update (Plus $15→$12, Unlimited $40→$32), Save 20% badge opacity changes, keyboard Enter/Space toggles
- [ ] **Plan card tests:** 3 plan cards render, Starter shows FREE and 3 grey-check features, Driver Plus shows $15 and 5 teal-check features, Driver Unlimited shows $40 and 8 purple-check features, current plan has "Your Current Plan" badge, non-current plans have actionable buttons, clicking Downgrade/Upgrade calls selectPlan
- [ ] **Trust row tests:** 4 trust cards render with correct titles and emojis
- [ ] **FAQ accordion tests:** 4 FAQ items render, clicking a question expands answer, clicking again collapses, only one FAQ open at a time, chevron rotates on expand, keyboard Enter/Space toggles, aria-expanded toggles correctly
- [ ] **Accessibility tests:** toggle has role="switch" and aria-checked, FAQ items have role="button" and aria-expanded, emoji spans have aria-hidden="true", plan card buttons have accessible labels
- [ ] **Computed signal tests:** currentPlanName returns correct name, billingInterval toggles correctly, plan prices compute based on interval

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `subscription-management.component.ts` | `subscription-management.component.spec.ts` | create |

## Dependencies

- Depends on: SP-1, SP-2, SP-3, SP-4, SP-5, SP-6, SP-7
- Blocked by: none

## Notes

- Use `vi.fn()` for mocking SubscriptionService methods
- Use `of()` from rxjs to mock observable returns
- Use `fixture.debugElement.query(By.css(...))` for DOM assertions
- Helper pattern: `el(selector)` and `all(selector)` and `text(selector)` like sprint 067
- Mock `window.open` for billing portal tests
- Target: ~50+ test cases
