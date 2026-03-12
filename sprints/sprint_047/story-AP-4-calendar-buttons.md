# Story AP-4: Attorney Calendar — Add View and Modify Buttons

**Status:** DONE

## Description
Added "View" and "Modify" action buttons to each event card in both the selected-day events section and the upcoming events section. Buttons have distinct visual styles (blue for View, orange for Modify) and meet WCAG touch target requirements (44×44px).

## Files Changed
- `frontend/src/app/features/attorney/attorney-calendar/attorney-calendar.component.ts` — added event-actions buttons to both event card sections, added `.btn-event`, `.btn-view`, `.btn-modify` CSS
- `frontend/src/assets/i18n/en.json` — added `ATT.VIEW_EVENT` and `ATT.MODIFY_EVENT` keys
