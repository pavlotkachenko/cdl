# Story ATT-8: Attorney Routing & i18n

**Status:** DONE

## Description
Updated attorney routing module with lazy-loaded routes for all new pages, and added ATT.* i18n keys to all three language files (EN, ES, FR).

## Changes
- Added lazy-loaded routes: cases, clients, calendar, notifications, reports, documents
- Converted dashboard route from eager to lazy-loaded
- Added ~140 ATT.* translation keys to en.json
- Added ~140 ATT.* translation keys to es.json (Spanish)
- Added ~140 ATT.* translation keys to fr.json (French)
- Keys cover: dashboard, cases, clients, calendar, notifications, reports, documents sections

## Files Changed
- `frontend/src/app/features/attorney/attorney-routing.module.ts` — updated routes
- `frontend/src/assets/i18n/en.json` — added ATT section
- `frontend/src/assets/i18n/es.json` — added ATT section
- `frontend/src/assets/i18n/fr.json` — added ATT section
