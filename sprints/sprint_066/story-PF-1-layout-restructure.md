# Story: PF-1 — Frontend — Page Header & Layout Restructure

**Sprint:** sprint_066
**Priority:** P0
**Status:** DONE

## User Story

As Miguel (Driver),
I want a clear "Secure Checkout" page header with back navigation and a professional 2-column checkout layout,
So that I feel confident I'm on a legitimate, organized payment page.

## Scope

### Files to Modify
- `frontend/src/app/features/driver/case-payment/case-payment.component.html`
- `frontend/src/app/features/driver/case-payment/case-payment.component.scss`

### Implementation

#### Page Header
Replace the current simple header (`back-btn` + `pay-title`) with:
1. Back button — rounded square (32px) with chevron SVG, border, hover teal
2. Section label — "Secure Checkout" with credit card SVG icon and teal line prefix (same pattern as case-detail hero)
3. Page title — "Pay Attorney Fee" (22px, weight 800)
4. Subtitle — "Review your case details and complete payment securely via Stripe" (13px muted)

#### Layout Restructure
Change from current `1fr 1fr` grid to:
1. **Left column (1fr):** Case summary card + Payment options card (with card form inside)
2. **Right column (360px fixed):** Order summary (sticky) + Attorney card + Trust badges
3. Max-width: 960px, centered
4. Mobile (<=768px): stack to single column, right column items after left

#### Loading State
Replace `<mat-spinner>` with a CSS-only spinner (inline SVG animation or CSS keyframes). Pattern:
```html
<div class="loading-spinner" aria-label="Loading...">
  <svg class="spin" width="32" height="32" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="31 31" stroke-linecap="round"/>
  </svg>
</div>
```

## Acceptance Criteria

- [ ] Page header shows: back button (chevron SVG) + "Secure Checkout" label + "Pay Attorney Fee" title + subtitle
- [ ] Layout is 2-column: left (1fr) + right (360px fixed)
- [ ] Right column is `position: sticky; top: 16px`
- [ ] At <=768px breakpoint: columns stack, right column below left
- [ ] Max-width 960px, horizontally centered
- [ ] No `<mat-spinner>` — replaced with CSS spinner
- [ ] Back button has `aria-label="Go back to case details"`
- [ ] Loading state has `aria-label="Loading case details"`
- [ ] `fadeIn` animation on page header and layout (CSS keyframes)

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `case-payment.component.ts` | `case-payment.component.spec.ts` | defer to PF-7 |

## Dependencies

- Depends on: none
- Blocked by: none

## Notes

- **Content area only.** The app shell (sidebar nav, topbar, footer) is rendered by the parent layout — do NOT touch them. This component only controls what's inside the `<router-outlet>`. The page header described here is the component's own internal header (back button + title), not the app topbar.
- This story sets up the structural shell. Content cards (case summary, payment options, sidebar) are filled in by subsequent stories.
- Keep the existing `@if (loadingCase())` / `@else` control flow structure.
- Remove `MatProgressSpinnerModule` from component imports.
