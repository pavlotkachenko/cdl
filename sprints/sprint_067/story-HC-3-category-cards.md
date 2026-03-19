# Story: HC-3 — Category Cards with FAQ Scroll & Filtering

**Sprint:** sprint_067
**Priority:** P0
**Status:** DONE

## User Story

As a CDL driver,
I want to browse help topics by category with visual cards,
So that I can quickly navigate to the type of help I need.

## Scope

### Files to Modify
- `frontend/src/app/features/driver/help/help.component.html`
- `frontend/src/app/features/driver/help/help.component.scss`

### Database Changes
- None

## Acceptance Criteria

- [ ] "Browse by Category" section with 6 category cards in a 3-column grid
- [ ] Each card shows: emoji icon (🚀, ➕, 📋, 📁, 💳, 🎧), title, description, and article count
- [ ] Article count is computed from FAQ data (e.g., "3 articles")
- [ ] Cards use custom HTML (no mat-card): white background, 16px border-radius, subtle shadow
- [ ] Card hover: translateY(-4px), teal border, teal shadow glow
- [ ] Clicking a card: sets `selectedCategory` signal AND scrolls to FAQ section (`#faq`)
- [ ] Grid is responsive: 3 cols → 2 cols (≤968px) → 1 col (≤640px)
- [ ] Cards use `@for` loop with `track` expression
- [ ] Each card has `cursor: pointer` and `role="button"` with `tabindex="0"` for a11y
- [ ] Keyboard: Enter/Space on a card triggers the same action as click

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `frontend/src/app/features/driver/help/help.component.html` | `help.component.spec.ts` | HC-7 |

## Dependencies

- Depends on: HC-1
- Blocked by: none

## Notes

- Cards do NOT navigate via routerLink anymore — they filter FAQs and scroll down
- The `scrollToFaq()` method uses `document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })`
- Article count per category comes from the `filteredCategories` computed signal in HC-1
