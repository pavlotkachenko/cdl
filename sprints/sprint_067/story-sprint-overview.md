# Sprint 067 — Help Center Redesign

**Goal:** Redesign the Driver Help & Support page to remove all Angular Material dependencies, adopt the teal design system with emoji icons, signals, OnPush, native control flow, and WCAG 2.1 AA accessibility — matching the provided HTML/CSS template.
**Branch:** `feat/sprint-067-help-center-redesign`
**Created:** 2026-03-19

## Stories

| # | ID | Title | Priority | Status | Depends On |
|---|-----|-------|----------|--------|------------|
| 1 | HC-1 | Component Modernization & Layout Foundation | P0 | DONE | none |
| 2 | HC-2 | Hero Banner & Search Redesign | P0 | DONE | HC-1 |
| 3 | HC-3 | Category Cards with FAQ Scroll & Filtering | P0 | DONE | HC-1 |
| 4 | HC-4 | FAQ Section — Custom Tabs & Accordion | P0 | DONE | HC-1 |
| 5 | HC-5 | Contact Cards, Resources & Footer CTA | P0 | DONE | HC-1 |
| 6 | HC-6 | Design System, Accessibility & Responsive | P1 | DONE | HC-2, HC-3, HC-4, HC-5 |
| 7 | HC-7 | Tests | P0 | DONE | HC-1 through HC-6 |

## Definition of Done

- [ ] All story statuses are DONE
- [ ] All acceptance criteria checked in every story file
- [ ] Backend tests pass: `cd backend && npm test`
- [ ] Frontend tests pass: `cd frontend && npx ng test --no-watch`
- [ ] No uncommitted changes
- [ ] Docs updated (API spec, functional reqs, bug registry as needed)
- [ ] PR created and approved by human reviewer

## Dependencies

- None — frontend-only redesign, no backend or DB changes

## Notes

- Sidebar and footer are NOT touched — only the main content area
- All `mat-*` imports removed; replaced with custom HTML/CSS + inline SVGs + emoji spans
- TranslateModule removed; all strings hardcoded in English (i18n can be layered later)
- Existing FAQ data model expanded with `icon` field per category
- Contact methods expanded with `availability` and `responseTime` fields
- New "resources" data model for helpful links section
