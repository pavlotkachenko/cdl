# Story: HC-2 — Hero Banner & Search Redesign

**Sprint:** sprint_067
**Priority:** P0
**Status:** DONE

## User Story

As a CDL driver,
I want a visually appealing hero banner with a functional search bar,
So that I can quickly find help topics and feel confident using the support center.

## Scope

### Files to Modify
- `frontend/src/app/features/driver/help/help.component.html`
- `frontend/src/app/features/driver/help/help.component.scss`

### Database Changes
- None

## Acceptance Criteria

- [ ] Hero section uses teal gradient background (`#1dad8c` → `#159a7a`, 135deg)
- [ ] Hero contains: headset emoji (🎧), "Help Center" h1, subtitle paragraph
- [ ] Search bar is a plain `<input>` with inline magnifying-glass SVG icon (no mat-form-field)
- [ ] Search input has `max-width: 600px`, white background, rounded corners (50px border-radius)
- [ ] Search input binds to `searchQuery` signal via `(input)` event
- [ ] Typing in search resets category filter to 'all' and filters FAQs in real time
- [ ] Hero is responsive: 80px padding on desktop → 48px on mobile (≤768px)
- [ ] Font sizes scale: h1 48px → 28px on mobile, subtitle 20px → 15px

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `frontend/src/app/features/driver/help/help.component.html` | `help.component.spec.ts` | HC-7 |

## Dependencies

- Depends on: HC-1
- Blocked by: none

## Notes

- No `::ng-deep` — all styles are component-scoped
- The search SVG icon is inline within the input wrapper div
- Placeholder text: "Search for help topics..."
