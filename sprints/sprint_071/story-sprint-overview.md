# Sprint 071 — Notification Preferences Redesign

**Sprint Goal:** Redesign the Notification Preferences page with the teal/purple design system, replacing the 2-card Angular Material layout with 4 grouped section cards, master toggles, quiet hours, channel status sidebar, and full accessibility compliance.

**Branch:** `feat/sprint-071-notification-preferences-redesign`

---

## Story Table

| ID    | Title                          | Priority | Status |
|-------|--------------------------------|----------|--------|
| NP-1  | Component Modernization        | P0       | DONE   |
| NP-2  | Page Header & Layout           | P0       | DONE   |
| NP-3  | Email Notifications Section    | P0       | DONE   |
| NP-4  | SMS Notifications Section      | P0       | DONE   |
| NP-5  | Push Notifications Section     | P0       | DONE   |
| NP-6  | Quiet Hours Section            | P1       | DONE   |
| NP-7  | Right Sidebar Cards            | P1       | DONE   |
| NP-8  | Save Bar & Dirty State         | P0       | DONE   |
| NP-9  | Design System & A11y           | P1       | DONE   |
| NP-10 | Tests                          | P0       | DONE   |

---

## Architecture

**Component:** `NotificationPreferencesComponent` (standalone, OnPush, external template/styles)

**Key Signals:**
- `emailToggles` — signal for 6 email toggle states
- `smsToggles` — signal for 2 SMS toggle states
- `pushToggles` — signal for 3 push toggle states
- `emailMasterOn` / `smsMasterOn` — master toggle signals
- `quietHoursEnabled` — signal<boolean>
- `quietFrom` / `quietUntil` — signal<string> (time values)
- `quietDays` — signal<Set<string>>
- `pushPermission` — signal<NotificationPermission>
- `isDirty` — computed from initial vs. current state
- `emailEnabledCount` / `pushEnabledCount` — computed for sidebar summary

**Services Used:**
- `UserPreferencesService` — SMS opt-in, push token
- `NotificationPreferencesService` — granular preference CRUD
- `Router` — navigation

**Design System:** Teal/purple palette with CSS custom properties, consistent with Sprint 066-070 redesigns.

---

## Key Decisions

1. External `templateUrl`/`styleUrl` files (not inline templates)
2. No Angular Material — pure HTML/SCSS with design system tokens
3. No TranslateModule — English-only for now
4. Native `@if`/`@for` control flow
5. All state managed via signals and computed()
6. Master toggle cascade: OFF disables children, ON restores previous values
7. SMS section gated on phone verification status
8. Quiet hours is frontend-only state initially (can be wired to backend later)

---

## Hidden Requirements

1. **Master toggle cascade** — Toggling master OFF dims all child rows and sets their value to false; toggling ON restores previous values (not all-on)
2. **SMS verification gate** — SMS master toggle shows amber state; child rows are pointer-events:none + opacity:0.5 until phone verified
3. **Marketing defaults off** — Marketing & News toggle must default to OFF even when email master is ON
4. **Push permission status pill** — Dynamically show "Permission Granted" (green), "Pending" (amber), or "Denied" (red) based on Notification.permission
5. **Dirty state tracking** — Save bar only activates when form has unsaved changes
6. **Save flash feedback** — Save button temporarily changes to green "Saved!" text for 2.2s, no snackbar
7. **Quiet hours urgent bypass** — Info note must clarify urgent alerts bypass quiet hours
8. **Dynamic sidebar counts** — Channel Status and Active Notifications summary update reactively as toggles change
9. **Emoji accessibility** — All emoji icons wrapped in `<span aria-hidden="true">`
10. **prefers-reduced-motion** — All animations respect prefers-reduced-motion: reduce

---

## Definition of Done

- [x] All 10 stories (NP-1 through NP-10) marked DONE
- [x] Angular Material fully removed from component
- [x] External templateUrl/styleUrl files
- [x] 4 section cards: Email (6 toggles), SMS (2 toggles + verify), Push (3 toggles), Quiet Hours
- [x] Master toggle cascade on Email and SMS sections
- [x] SMS disabled state with amber verification banner
- [x] Push permission status pill (granted/pending/denied)
- [x] Quiet hours: time pickers, day chips, urgent bypass note
- [x] Right sidebar: Channel Status, Active Notifications, Recommendations
- [x] Save bar: error feedback, save flash, reset to defaults
- [x] Full SCSS with CSS custom properties, teal design system
- [x] WCAG 2.1 AA: aria-labels, roles, semantic headings, focus-visible, 44px touch
- [x] All emojis aria-hidden="true"
- [x] prefers-reduced-motion respected
- [x] 4 responsive breakpoints
- [x] 59 tests passing
- [x] Frontend tests pass: `cd frontend && npx ng test --no-watch`
- [x] No lint errors
- [x] PR created for Gate 4 review
