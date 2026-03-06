# Story 17 — Mobile Responsiveness

**Sprint:** 013 — Mobile Responsiveness
**Status:** DONE

## Scope

Lighthouse audit, touch targets, keyboard input types, no horizontal scroll.

## Audit Findings & Fixes

### 17.1 Touch targets — FIXED
- `carousel-arrow`: `padding: 0` → `padding: 4px; min-width: 44px; min-height: 44px` + `:focus-visible` outline
- `testimonial-arrow`: `padding: 0` → `padding: 8px; min-width: 44px; min-height: 44px` + `:focus-visible` outline
- All Material buttons already covered globally in `styles.scss` ✓

### 17.2 Input type attributes — FIXED
**profile.component.ts:**
- `firstName` → added `type="text" autocomplete="given-name"`
- `lastName` → added `type="text" autocomplete="family-name"`
- `email` → added `inputmode="email" autocomplete="email"`
- `phone` → added `type="tel" inputmode="tel" autocomplete="tel"` (was missing `type` entirely)

**carrier-profile.component.ts:**
- `email` (readonly) → added `type="email" autocomplete="email"`
- `phone_number` already had `type="tel"` ✓

### 17.3 Driver Dashboard — FIXED
- `.dash-header`: added `flex-wrap: wrap; gap: 12px` so "Submit Ticket" button wraps below heading on narrow screens

### 17.4 Admin Dashboard — FIXED
- `.quick-actions`: added `flex-wrap: wrap` so "All Cases / Staff / Reports" buttons wrap on narrow screens

### 17.5 Landing page — FIXED
**FAQ section styles (landing.component.scss):**
- FAQ was added in Sprint 011 but had zero CSS — added complete styles
- `.faq-section` with `section-padding`, `.faq-list` flex column, `.faq-item` borders
- `.faq-question` button: `width: 100%; min-height: 44px; cursor: pointer; text-align: left`
- `.faq-icon` with `rotate(180deg)` transition for open state
- `.faq-answer` with padding and readable line-height
- `.faq-cta` centered flex column with gap

**480px breakpoint added:**
```scss
@media (max-width: 480px) {
  .hero-section { height: 300px; .hero-title { font-size: 1.5rem; } .hero-stats { display: none; } }
  .section-title { font-size: 1.6rem; }
  .faq-section .faq-question { font-size: 0.9rem; }
}
```

### 17.6 No horizontal scroll — ALREADY DONE ✓
`body { overflow-x: hidden; }` in `styles.scss`

### 17.7 Viewport meta — ALREADY DONE ✓
`<meta name="viewport" content="width=device-width, initial-scale=1">` in `index.html`

## Spec Files

### UPDATED: profile.component.spec.ts (+2 tests, 7 total)
- phone input has type=tel in edit mode for mobile keyboard
- email input has type=email in edit mode

### UPDATED: carrier-profile.component.spec.ts (+1 test, 6 total)
- phone input has type=tel for mobile numeric keyboard

## Total
352/352 tests pass (was 349 before Sprint 013, +3 new tests).
