# Story AP-4: Calendar View/Modify Buttons — Expand/Collapse Toggle

**Status:** DONE

## Description
Changed the View and Modify buttons on calendar event cards from static (no-op) buttons to toggle buttons that expand/collapse event details. Clicking View or Modify toggles the visibility of location, case number, client name, and notes. Only one event can be expanded at a time. Added `expandedEventId` signal, `toggleEvent()` method, `aria-expanded` attribute, active button styling, and slide-down animation.

## Files Changed
- `frontend/src/app/features/attorney/attorney-calendar/attorney-calendar.component.ts` — added `expandedEventId` signal, `toggleEvent()` method, wrapped detail fields in `@if (expandedEventId() === evt.id)` blocks for both selected-day and upcoming sections, added `btn-active` CSS class and `event-details-expanded` animation
