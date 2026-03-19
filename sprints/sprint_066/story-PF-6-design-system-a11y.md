# Story: PF-6 — Frontend — Teal Design System, Remove Material deps, Accessibility

**Sprint:** sprint_066
**Priority:** P1
**Status:** DONE

## User Story

As Miguel (Driver),
I want the payment page to use the same teal design system as the rest of the app, be fully keyboard navigable, and work on my phone,
So that the experience is consistent, accessible, and usable on any device.

## Scope

### Files to Modify
- `frontend/src/app/features/driver/case-payment/case-payment.component.html`
- `frontend/src/app/features/driver/case-payment/case-payment.component.scss`
- `frontend/src/app/features/driver/case-payment/case-payment.component.ts`

### Implementation

#### 1. Color Migration: Blue → Teal
Replace all blue accent colors with the teal design system:

| Current (Blue) | New (Teal) | Usage |
|----------------|------------|-------|
| `#3b82f6` | `#1dad8c` | Primary accent, links, selected states |
| `#1d4ed8` | `#17a07f` | Gradient end, hover states |
| `#eff6ff` | `#f0faf7` | Light background tints |
| `#dbeafe` | `#e4f5f1` | Badge backgrounds |
| `#bfdbfe` | `#c0e8dd` | Border accents |
| `rgba(59,130,246,.12)` | `rgba(29,173,140,.1)` | Focus rings, box shadows |

Keep blue only for the attorney avatar gradient (it distinguishes the attorney visually).

#### 2. Remove Angular Material Dependencies
Remove from component:
- `MatProgressSpinnerModule` from `imports` array
- `MatSnackBar` from injected services
- All `this.snackBar.open()` calls → replace with `paymentError` / `paymentSuccess` signals

Error/success feedback pattern:
```html
@if (paymentError()) {
  <div class="inline-error" role="alert" aria-live="assertive">
    <span aria-hidden="true"><!-- error SVG --></span>
    {{ paymentError() }}
  </div>
}
```

#### 3. Font
Ensure `font-family: 'Mulish', -apple-system, sans-serif` is set on the page container. The Mulish font is loaded globally via `<link>` in index.html.

#### 4. Accessibility Enhancements
- Payment options: `role="radiogroup"`, `aria-label="Choose payment option"`
- Each option card: `role="radio"`, `aria-checked="true|false"`, `tabindex="0"`
- Arrow key navigation between payment options (left/right)
- Card form fields: `<label>` elements with `for` attributes pointing to Stripe element containers
- Error messages: `role="alert"`, `aria-live="assertive"`
- Pay button: `aria-label` with amount, `aria-busy="true"` when processing
- Trust badges: no interactive elements, just semantic HTML
- Focus visible outlines: 2px teal on all interactive elements
- Touch targets: minimum 44px height on all buttons and interactive elements
- Skip link consideration: not needed (single-purpose page)

#### 5. Responsive Breakpoints
```scss
// Desktop (default)
.payment-layout { grid-template-columns: 1fr 360px; }

// Tablet (<=900px)
@media (max-width: 900px) {
  .payment-layout { grid-template-columns: 1fr 320px; gap: 18px; }
}

// Mobile (<=768px)
@media (max-width: 768px) {
  .payment-layout { grid-template-columns: 1fr; }
  .payment-options { flex-direction: column; } // Stack payment cards
  .f-row { grid-template-columns: 1fr; } // Stack expiry + CVV
}

// Small mobile (<=480px)
@media (max-width: 480px) {
  .content { padding: 16px; }
  .pay-card-header { padding: 14px 16px; }
}
```

#### 6. Animations
```scss
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.page-header { animation: fadeIn .3s ease both; }
.payment-layout { animation: fadeIn .3s .06s ease both; }
```

Respect `prefers-reduced-motion`:
```scss
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; }
}
```

## Acceptance Criteria

- [ ] All blue accent colors replaced with teal equivalents
- [ ] Attorney avatar remains blue (intentional distinction)
- [ ] No `MatProgressSpinnerModule` or `MatSnackBar` in component imports
- [ ] No `this.snackBar` calls — all feedback via inline signals
- [ ] Error messages use `role="alert"` and `aria-live="assertive"`
- [ ] Payment option cards: `role="radiogroup"`, arrow key navigation works
- [ ] All interactive elements have visible focus outlines (teal, 2px)
- [ ] All buttons/inputs have minimum 44px touch target height
- [ ] Responsive: proper layout at desktop (>900px), tablet (768-900px), mobile (<768px), small mobile (<480px)
- [ ] Payment option cards stack vertically on mobile
- [ ] Expiry + CVV row stacks on mobile
- [ ] `fadeIn` animation on load, respects `prefers-reduced-motion`
- [ ] Font is Mulish throughout the payment page

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `case-payment.component.ts` | `case-payment.component.spec.ts` | defer to PF-7 |

## Dependencies

- Depends on: PF-1 (layout structure)
- Blocked by: none

## Notes

- **Content area only.** The app shell (sidebar nav, topbar, footer) is NOT in scope. Only the case-payment component content is restyled. Do not add sidebar, topbar, or footer styles.
- The `secure-note` below the pay button is replaced by the `stripe-badge` inside the card form and the trust badges in the sidebar. Remove the old `.secure-note` element.
- Custom scrollbar styling (from template) is optional — the `::-webkit-scrollbar` styles in the HTML template are nice-to-have.
