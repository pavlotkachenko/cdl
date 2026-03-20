# Sprint 072 — Case Detail Redesign

**Sprint Goal:** Redesign the Case Detail page with the teal/purple design system, replacing existing styles with CSS custom properties, teal gradient hero header, redesigned info grid, alert cards, documents section, messages, activity log, attorney card, timeline, quick actions, and full accessibility compliance.

**Branch:** `feat/sprint-072-case-detail-redesign`

---

## Story Table

| ID     | Title                                    | Priority | Status |
|--------|------------------------------------------|----------|--------|
| CD2-1  | Design Tokens & SCSS Foundation          | P0       | DONE   |
| CD2-2  | Case Hero Header Redesign                | P0       | DONE   |
| CD2-3  | Case Info Grid & Edit Mode Restyle       | P0       | DONE   |
| CD2-4  | Court Date & Pay Attorney Alert Redesign | P0       | DONE   |
| CD2-5  | Documents Section & Upload Zone          | P0       | DONE   |
| CD2-6  | Messages Section Redesign                | P1       | DONE   |
| CD2-7  | Activity Log Redesign                    | P1       | DONE   |
| CD2-8  | Attorney Card Redesign                   | P0       | DONE   |
| CD2-9  | Status Timeline Redesign                 | P1       | DONE   |
| CD2-10 | Quick Actions Grid Redesign              | P1       | DONE   |
| CD2-11 | Accessibility, Responsive & Reduced Motion | P0     | DONE   |
| CD2-12 | Test Updates                             | P0       | DONE   |

---

## Architecture

**Component:** `CaseDetailComponent` (standalone, OnPush, external template/styles)

**Files Modified:**
- `frontend/src/app/features/driver/case-detail/case-detail.component.scss`
- `frontend/src/app/features/driver/case-detail/case-detail.component.html`
- `frontend/src/app/features/driver/case-detail/case-detail.component.spec.ts`

**NO .ts changes** — this sprint is purely SCSS, HTML, and test updates.

**Design System:** Teal/purple palette with CSS custom properties, consistent with Sprint 066-071 redesigns.

---

## Key Decisions

1. Replace SCSS `$variables` with CSS custom properties on `:host`
2. No Angular Material changes — pure SCSS/HTML redesign
3. No .ts logic changes — only template, styles, and tests
4. Teal gradient hero header with white text and stat dividers
5. Amber/purple gradient alert cards for court date and pay attorney
6. Role-based avatar colors in messages section
7. Animated current dot on status timeline
8. All state managed via existing signals (no new signals needed)

---

## Hidden Requirements

1. **Emoji accessibility** — Every emoji `<span>` must have `aria-hidden="true"`
2. **doc.fileSize guard** — `doc.fileSize` may be `undefined`; guard against it in template
3. **Status badge on teal gradient** — Needs white pill styling to remain visible on dark background
4. **Attorney availability dot** — Purely visual decoration, must have `aria-hidden="true"`
5. **Edit mode teal** — Edit mode inputs/borders use teal instead of blue
6. **Message avatar role-based colors** — Different avatar background colors per user role
7. **prefers-reduced-motion** — Disables ALL animations and transitions
8. **Toast z-index** — Must be above modal overlays
9. **Hero buttons inverted** — Buttons on dark teal gradient background need inverted/outlined styling
10. **Breadcrumb aria-current** — `aria-current="page"` must be preserved on breadcrumb
11. **Share aria-live** — `aria-live="polite"` on share confirmation must be preserved
12. **Footer SVG aria-hidden** — Footer decorative SVGs must retain `aria-hidden="true"`

---

## Definition of Done

- [x] All 12 stories (CD2-1 through CD2-12) marked DONE
- [x] SCSS `$variables` replaced with CSS custom properties on `:host`
- [x] Teal gradient hero header with white text, stat dividers, inverted buttons
- [x] Info grid with teal-tinted headers, updated borders, teal edit mode
- [x] Court date (amber) and pay attorney (purple) gradient alert cards
- [x] Documents section with dashed upload zone and file size display
- [x] Messages section with role-based avatar colors and improved bubbles
- [x] Activity log with left border indicators and teal accents
- [x] Attorney card with availability dot, teal stats, enhanced avatar
- [x] Status timeline with teal/green markers and animated current dot
- [x] Quick actions grid with larger icons and hover effects
- [x] WCAG 2.1 AA: aria-labels, roles, semantic headings, focus-visible, 44px touch
- [x] All emojis `aria-hidden="true"`
- [x] `prefers-reduced-motion` respected
- [x] 3 responsive breakpoints (1200px, 768px, 480px)
- [x] 69 tests passing (46 existing + 23 new Sprint 072 tests)
- [x] Frontend tests pass: `cd frontend && npx ng test --no-watch`
- [x] Critic verdict: APPROVED (0 blocking, 4 advisory)
- [ ] PR created for Gate 4 review
