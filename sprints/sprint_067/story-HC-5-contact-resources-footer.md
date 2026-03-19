# Story: HC-5 — Contact Cards, Resources & Footer CTA

**Sprint:** sprint_067
**Priority:** P0
**Status:** DONE

## User Story

As a CDL driver,
I want to see contact options and helpful resource links,
So that I can reach support through my preferred channel or navigate to key pages.

## Scope

### Files to Modify
- `frontend/src/app/features/driver/help/help.component.html`
- `frontend/src/app/features/driver/help/help.component.scss`

### Database Changes
- None

## Acceptance Criteria

- [ ] "Still Need Help?" section with subtitle and 4 contact cards in a grid
- [ ] Contact cards: Email (📧), Phone (📞), Live Chat (💬), Support Ticket (📝)
- [ ] Each card shows: emoji icon, title, value (email/phone/etc), description, availability, response time
- [ ] Cards are custom HTML (no mat-card): white bg, rounded corners, hover lift effect
- [ ] Contact grid: 4 cols → 2 cols (≤968px) → 1 col (≤640px)
- [ ] Clicking a card triggers appropriate action (mailto:, tel:, router navigate, chat)
- [ ] "Helpful Resources" section with 6 link cards in a 3-column grid
- [ ] Resource links: Submit a Ticket, My Cases, Analytics, My Profile, Privacy Policy, Terms of Service
- [ ] Each resource link shows emoji + label, uses `routerLink` for internal navigation
- [ ] Resource grid: 3 cols → 2 cols (≤768px) → 1 col (≤480px)
- [ ] Resource card has light gray background, white border, teal hover state
- [ ] Footer CTA banner: teal gradient background with "Ready to Get Started?" heading and "Submit a Ticket" button
- [ ] CTA button: white background, teal text, rounded, hover shadow, navigates to `/driver/submit-ticket`

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `frontend/src/app/features/driver/help/help.component.html` | `help.component.spec.ts` | HC-7 |

## Dependencies

- Depends on: HC-1
- Blocked by: none

## Notes

- Contact card click handling uses `openContactMethod()` from HC-1
- Resource links use `routerLink` directly in the template, not click handlers
- Footer CTA is the bottom section before the page ends (sidebar/footer untouched)
