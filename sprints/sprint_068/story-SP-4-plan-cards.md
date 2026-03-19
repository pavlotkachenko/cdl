# Story: SP-4 — Plan Cards with Tier Colors

**Sprint:** sprint_068
**Priority:** P0
**Status:** DONE

## User Story

As a CDL driver,
I want to see all available plans in a visually distinct card grid,
So that I can compare features and choose the right plan.

## Scope

### Files to Modify
- `frontend/src/app/features/attorney/subscription-management/subscription-management.component.ts`
- `frontend/src/app/features/attorney/subscription-management/subscription-management.component.html`
- `frontend/src/app/features/attorney/subscription-management/subscription-management.component.scss`

### Database Changes
- None

## Acceptance Criteria

- [ ] "Available Plans" section label with uppercase styling and trailing line
- [ ] 3-column grid: Starter, Driver Plus, Driver Unlimited
- [ ] **Starter card:** tier label "Starter" (grey), name "Free Forever", price "FREE", tagline "New accounts start here", description "Free forever — use it only when you need it."
- [ ] Starter features (3, grey checks): Unlimited ticket submissions, Evaluation within 24 hours, 1 free phone consultation
- [ ] Starter CTA: "Downgrade to Free" button (white bg, border, chevron icon)
- [ ] **Driver Plus card:** tier label "Driver Plus" (teal), price "$15/month" (or $12 annual), tagline "Get covered"
- [ ] Plus features (5, teal checks): Unlimited submissions, Evaluation within **1 hour**, Phone consultations included, 1-on-1 lawyer or complete case support, PSP examination included
- [ ] Plus card has "⚡ Your Current Plan" badge when it is the active plan (teal gradient banner)
- [ ] Plus CTA: "Current Plan" disabled button + "Active since" label when current; "Select" button otherwise
- [ ] **Driver Unlimited card:** tier label "Driver Unlimited" (purple `#8b5cf6`), price "$40/month" (or $32 annual)
- [ ] Unlimited features (8, purple checks): All Plus features + Lawyer & Court fees for 2 tickets/year, MVR & PSP examination, **24/7 support**, Serious cases up to **$1,000**
- [ ] Unlimited CTA: "Upgrade to Unlimited" button (purple gradient)
- [ ] Each feature has a "?" tooltip circle on the right side
- [ ] Plan cards have hover lift effect (translateY -3px, shadow-md)
- [ ] Current plan card has teal border + outer glow (0 0 0 3px rgba(29,173,140,.12))
- [ ] Prices update dynamically based on `billingInterval` signal
- [ ] Clicking a non-current plan button calls `selectPlan()` with appropriate price_id

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `subscription-management.component.html` | `subscription-management.component.spec.ts` | SP-8 |

## Dependencies

- Depends on: SP-3 (billing toggle signal)
- Blocked by: none

## Notes

- Plan data is hardcoded in the component (not from API `getPlans()`) to match the template exactly
- The `isCurrentPlan()` check compares plan id with `subscription().plan_name`
- Feature tooltips are visual-only for now (no popover content)
- Purple color system: `--purple: #8b5cf6`, `--purple-bg: #f5f3ff`, `--purple-border: #ddd6fe`
