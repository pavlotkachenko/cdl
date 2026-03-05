# Story 4.2 — Touch Target Audit

**Epic:** Mobile Polish
**Priority:** HIGH
**Status:** DONE

## User Story
As a driver with large fingers using my phone,
I want all buttons and icons to be large enough to tap accurately,
so that I don't tap the wrong thing.

## Scope
- Audit all interactive elements: icon buttons in header/nav, chip buttons, small action buttons
- Minimum 44x44px hit area via padding or min-height/min-width (not changing visual size)
- Priority areas:
  - Ticket submission flow
  - Navigation bar
  - Case detail action buttons
  - Attorney selection cards

## Acceptance Criteria
- [ ] All interactive elements >= 44x44px touch target
- [ ] AXE audit passes — no "touch target too small" violations
- [ ] No visual size changes — only padding/min-size applied
