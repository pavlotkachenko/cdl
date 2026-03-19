# Sprint 070 — Notification Center Redesign

**Sprint Goal:** Redesign the Notification Center page with the teal/purple design system, adding date-grouped lists, real-time WebSocket updates, case grouping, batch operations, and full accessibility compliance.

**Branch:** `feat/sprint-070-notification-center-redesign`

---

## Story Table

| ID   | Title                        | Priority | Status |
|------|------------------------------|----------|--------|
| NR-1 | Component Modernization      | P0       | DONE   |
| NR-2 | Page Header & Summary Cards  | P0       | DONE   |
| NR-3 | Tab Bar & Toolbar            | P0       | DONE   |
| NR-4 | Date-Grouped List            | P0       | DONE   |
| NR-5 | Notification Items           | P0       | DONE   |
| NR-6 | Interactive Actions          | P0       | DONE   |
| NR-7 | Design System & A11y         | P1       | DONE   |
| NR-8 | Empty State & Footer         | P1       | DONE   |
| NR-9 | WebSocket Realtime           | P1       | DONE   |
| NR-10| Case Grouping                | P1       | DONE   |
| NR-11| Batch Select                 | P2       | DONE   |
| NR-12| Tests                        | P0       | DONE   |

---

## Architecture

**Component:** `NotificationCenterComponent` (standalone, OnPush)

**Key Signals:**
- `notifications` — full list from service
- `selectedFilter` — 'all' | 'unread' | 'read' | 'action_needed'
- `filteredNotifications` — computed from notifications + selectedFilter
- `groupedNotifications` — computed date-grouped structure (Today, Yesterday, Earlier this week, Older)
- `selectedItems` — signal<Set<string>> for batch selection
- `actionNeededCount` — computed: notifications where priority==='high' || type==='court_reminder'

**Services Used:**
- `NotificationService` — CRUD operations, WebSocket connection, mark-read, delete
- `Router` — navigation to case details, settings

**Design System:** Teal/purple palette with CSS custom properties, consistent with Sprint 066-068 redesigns.

---

## Key Decisions

1. External `templateUrl`/`styleUrl` files (not inline templates)
2. No Angular Material — pure HTML/SCSS with design system tokens
3. No TranslateModule — English-only for now
4. Native `@if`/`@for` control flow (no `*ngIf`/`*ngFor`)
5. All state managed via signals and computed()
6. WebSocket integration via existing NotificationService.connectWebSocket()
7. Case grouping collapses notifications sharing `related_case_id`

---

## Hidden Requirements

1. **Action Needed count** — "Action Needed" summary card count = notifications where `priority === 'high'` OR `type === 'court_reminder'`
2. **Computed date grouping** — Use `computed()` signal for reactive grouping, not imperative code
3. **Contextual CTA links** — Each notification type has a specific CTA: case_update -> "View Case", message -> "Reply to Message", payment -> "View Receipt", court_reminder -> "View Case", resolved -> "View Resolution"
4. **Read item dimming** — Read notifications get muted text, no colored left bar, no NEW pill
5. **prefers-reduced-motion** — All animations respect `prefers-reduced-motion: reduce`
6. **Context-aware empty state** — Empty state subtitle changes based on active filter
7. **Exponential backoff reconnection** — WebSocket uses existing exponential backoff in NotificationService
8. **Case grouping badge** — Collapsed case groups show "N updates" badge and most recent notification as primary
9. **Batch selection signal** — Selection state via `signal<Set<string>>`, cleared after bulk action
10. **Emoji accessibility** — All emojis wrapped in `aria-hidden="true"` spans

---

## Deferred

_(None — all hidden requirements promoted to stories)_

---

## Definition of Done

- [x] All 12 stories (NR-1 through NR-12) marked DONE
- [x] Component modernized: no Angular Material, no TranslateModule, external templates, @if/@for
- [x] Page header with summary cards (All, Unread, Read, Action Needed) with click-to-filter
- [x] Tab bar with pill-group tabs and count badges
- [x] Date-grouped notification list (Today, Yesterday, Earlier this week, Older)
- [x] Notification items with colored bars, type chips, CTAs, read/unread states
- [x] Interactive actions: hover mark-read, delete, mark-all-read with reactive counters
- [x] Full SCSS with CSS custom properties, animations, 4 breakpoints
- [x] WCAG 2.1 AA: aria-labels, roles, semantic headings, focus-visible, 44px touch targets
- [x] Empty state with context-aware subtitle per filter
- [x] Footer with count and preferences link
- [x] WebSocket integration: auto-prepend, unread counter, toast, disconnect on destroy
- [x] Case grouping: collapse by related_case_id, expand on click
- [x] Batch select: checkboxes, select-all, bulk mark-read/delete
- [x] ~55 tests passing covering all features
- [x] Frontend tests pass: `cd frontend && npx ng test --no-watch`
- [x] No lint errors
- [x] PR created and posted for Gate 4 review
