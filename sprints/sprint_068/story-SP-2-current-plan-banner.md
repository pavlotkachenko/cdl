# Story: SP-2 — Current Plan Banner

**Sprint:** sprint_068
**Priority:** P0
**Status:** DONE

## User Story

As a CDL driver,
I want to see my current subscription plan in a prominent banner with key details and actions,
So that I can quickly understand my plan status and manage it.

## Scope

### Files to Modify
- `frontend/src/app/features/attorney/subscription-management/subscription-management.component.html`
- `frontend/src/app/features/attorney/subscription-management/subscription-management.component.scss`

### Database Changes
- None

## Acceptance Criteria

- [ ] Full-width banner card with gradient top stripe (3px, teal gradient `linear-gradient(90deg, #1dad8c, #2dd4bf)`)
- [ ] Plan badge icon: 52×52px teal gradient rounded square with ⚡ emoji
- [ ] Plan name displayed (e.g., "Driver Plus") with Active badge (green bg, pulse dot animation)
- [ ] Price shown large ($15) with "/ month" suffix and renewal date with calendar SVG icon
- [ ] "Manage Billing" button (secondary style) calls `openBillingPortal()`
- [ ] "Cancel Plan" button (danger ghost style) calls `cancelSubscription()` — only shown for active/trialing status
- [ ] Usage row below banner with 4 stats: Cases (📋), Evaluation SLA (⏱️), Consultations (📞), PSP Examination (🔍)
- [ ] Each usage item has colored icon background (teal, blue, amber, green)
- [ ] Cancel notice shown when `cancel_at_period_end` is true
- [ ] "No active subscription" state when subscription is null
- [ ] Banner has `@keyframes fadeIn` animation (0.3s)

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `subscription-management.component.html` | `subscription-management.component.spec.ts` | SP-8 |

## Dependencies

- Depends on: SP-1
- Blocked by: none

## Notes

- Usage stats are hardcoded display values matching the template (not from API)
- Active badge has CSS `@keyframes pulse` animation on the dot
- Renewal date comes from `subscription().current_period_end`
