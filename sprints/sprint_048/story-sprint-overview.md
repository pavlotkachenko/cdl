# Sprint 048 — Attorney Pages Polish & i18n Fixes

**Goal:** Fix i18n translations for Spanish/French across all Attorney pages, ensure mock data renders in Dashboard and My Cases, add expand/collapse to Calendar event buttons, and remove Subscription from Attorney sidebar.

## Stories

| ID | Title | Status |
|----|-------|--------|
| AP-1 | Fix i18n: Add missing ATT keys to es.json and fr.json | DONE |
| AP-2 | Attorney Dashboard — mock data fallback for all sub-components | DONE |
| AP-3 | Attorney My Cases — mock data fallback for all sub-components | DONE |
| AP-4 | Calendar View/Modify buttons — expand/collapse toggle | DONE |
| AP-5 | Remove Subscription from Attorney sidebar | DONE |

## Definition of Done
- [x] All ATT keys in en.json exist in es.json and fr.json with proper translations
- [x] Switching to ES or FR shows translated text for all Attorney pages
- [x] Dashboard and My Cases show mock data when API returns empty
- [x] Calendar View/Modify buttons toggle event detail visibility
- [x] Attorney sidebar no longer shows Subscription nav item
- [x] Build passes with no errors
