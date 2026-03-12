# Story AD-4: Admin Settings Route & i18n

**Status:** DONE

## Description
Added the settings route to admin routing and added ~45 ADMIN.SETTINGS_* i18n keys to all three language files.

## Changes
- Added lazy-loaded `/admin/settings` route pointing to AdminSettingsComponent
- Added ADMIN.CASES_THIS_WEEK key (used by merged dashboard)
- Added ~45 ADMIN.SETTINGS_* keys to en.json (English)
- Added ~45 ADMIN.SETTINGS_* keys to es.json (Spanish)
- Added ~45 ADMIN.SETTINGS_* keys to fr.json (French)

## Files Changed
- `frontend/src/app/features/admin/admin-routing.module.ts` — added settings route
- `frontend/src/assets/i18n/en.json` — added settings + dashboard i18n keys
- `frontend/src/assets/i18n/es.json` — added settings + dashboard i18n keys
- `frontend/src/assets/i18n/fr.json` — added settings + dashboard i18n keys
