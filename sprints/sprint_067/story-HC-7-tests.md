# Story: HC-7 — Tests

**Sprint:** sprint_067
**Priority:** P0
**Status:** DONE

## User Story

As a developer,
I want comprehensive unit tests for the redesigned HelpComponent,
So that regressions are caught and all acceptance criteria are verified.

## Scope

### Files to Create
- `frontend/src/app/features/driver/help/help.component.spec.ts`

### Database Changes
- None

## Acceptance Criteria

- [ ] Test file created and all tests pass via `npx ng test --no-watch`
- [ ] **Page structure tests:** hero section renders, search bar renders, categories section renders, FAQ section renders, contact section renders, resources section renders, footer CTA renders
- [ ] **Search tests:** typing in search filters FAQs, search resets category to 'all', clearing search shows all FAQs, no-results state shown when nothing matches
- [ ] **Category tests:** 6 category cards render with correct emojis and titles, clicking a card sets selectedCategory, clicking a card scrolls to FAQ section, article count computed correctly per category
- [ ] **Tab tests:** 6 tab buttons render, clicking a tab filters FAQs, active tab has correct CSS class and aria-selected="true"
- [ ] **FAQ accordion tests:** FAQ items render for selected category, clicking a question expands the answer, clicking again collapses it, only one FAQ expanded at a time, keyboard (Enter/Space) toggles expansion, aria-expanded toggles correctly
- [ ] **Contact tests:** 4 contact cards render with correct data, clicking email card calls window.open with mailto:, clicking phone card calls window.open with tel:
- [ ] **Resources tests:** 6 resource links render with routerLinks
- [ ] **Computed signal tests:** filteredFAQs returns all when category='all' and no search, filteredFAQs filters by category, filteredFAQs filters by search query, filteredFAQs filters by both category and search, hasResults returns false when no matches
- [ ] **Accessibility tests:** search input has aria-label, tab container has role="tablist", FAQ headers have role="button", FAQ headers have aria-expanded, emoji spans have aria-hidden="true"
- [ ] **Design tests:** hero has teal gradient background class, category cards have hover class setup, footer CTA section renders with link to submit-ticket

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `frontend/src/app/features/driver/help/help.component.ts` | `help.component.spec.ts` | create |

## Dependencies

- Depends on: HC-1, HC-2, HC-3, HC-4, HC-5, HC-6
- Blocked by: none

## Notes

- Use `vi.fn()` for mocking Router, `vi.spyOn(window, 'open')` for external links
- Use `fixture.debugElement.query(By.css(...))` for DOM assertions
- Mock `document.getElementById` for scroll-to-FAQ tests
- Test helper pattern: `el(selector)` and `text(selector)` like sprint 066
- Target: ~50+ test cases across all categories
