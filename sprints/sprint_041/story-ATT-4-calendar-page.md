# Story ATT-4: Attorney Calendar Page

**Status:** DONE

## Description
Created a calendar page with month/week/list views, court dates, appointments, deadlines, and color-coded event types.

## Changes
- Monthly calendar grid with day cells and event dots
- Week view with time slots
- List view for upcoming events
- Event types: Court Hearing (red), Deadline (amber), Consultation (blue), Filing (purple), Meeting (green)
- 15+ mock events across current and next month
- Click-to-view event details in side panel
- Add event button (UI only)
- Navigation: previous/next month, today button
- Full i18n with ATT.* keys
- OnPush change detection, signals-based state

## Files Changed
- `frontend/src/app/features/attorney/attorney-calendar/attorney-calendar.component.ts` — new file
