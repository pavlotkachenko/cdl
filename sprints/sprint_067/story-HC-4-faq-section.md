# Story: HC-4 — FAQ Section — Custom Tabs & Accordion

**Sprint:** sprint_067
**Priority:** P0
**Status:** DONE

## User Story

As a CDL driver,
I want to browse FAQs by category tabs and expand individual questions,
So that I can find answers quickly without leaving the help page.

## Scope

### Files to Modify
- `frontend/src/app/features/driver/help/help.component.html`
- `frontend/src/app/features/driver/help/help.component.scss`

### Database Changes
- None

## Acceptance Criteria

- [ ] FAQ section has id="faq" for scroll targeting
- [ ] Section header: "Frequently Asked Questions" h2 + subtitle
- [ ] Custom tab bar replaces mat-chip-listbox: plain `<button>` elements with `.tab-btn` class
- [ ] Tabs: All Topics, Getting Started, Submit Ticket, Track Cases, Documents, Billing
- [ ] Active tab has teal background + white text; inactive tabs have border + hover state
- [ ] Each FAQ item is a custom accordion (no mat-expansion-panel): clickable header with chevron SVG
- [ ] Chevron rotates 180° when expanded (CSS transform transition)
- [ ] FAQ item shows emoji icon (from FAQ data), question text, and collapsible answer
- [ ] Answer panel uses `max-height` + `overflow: hidden` CSS transition for smooth expand/collapse
- [ ] Each FAQ header has `role="button"`, `aria-expanded`, `aria-controls`, `tabindex="0"`
- [ ] Answer panel has `role="region"`, `aria-labelledby` pointing to header
- [ ] Keyboard: Enter/Space toggles FAQ open/close
- [ ] No-results state shown when `filteredFAQs` is empty: search-off emoji, message, "Clear Search" button
- [ ] "Clear Search" resets `searchQuery` to '' and `selectedCategory` to 'all'
- [ ] FAQ items use `@for` with `track` expression
- [ ] `@if` used for conditional rendering (no-results, expanded state)

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `frontend/src/app/features/driver/help/help.component.html` | `help.component.spec.ts` | HC-7 |

## Dependencies

- Depends on: HC-1
- Blocked by: none

## Notes

- The component tracks expanded FAQ index with a signal (`expandedFaqIndex: signal<number | null>(null)`)
- `toggleFaq(index: number)` method: sets to index if different, null if same (collapse)
- Max-height transition: 0 → 500px over 0.3s ease
- FAQ answers may contain multi-sentence text — use `line-height: 1.7` for readability
