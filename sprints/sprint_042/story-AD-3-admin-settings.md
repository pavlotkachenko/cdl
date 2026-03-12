# Story AD-3: Create Admin Settings Page

**Status:** DONE

## Description
Created a new admin settings page to fix the Settings tab that was previously redirecting to the dashboard (no route existed). Follows the carrier settings pattern.

## Changes
- New AdminSettingsComponent with 5 settings sections:
  1. Firm Information: name, email, phone, address, city, state, ZIP (reactive form, pre-filled mock data)
  2. Notification Preferences: 5 toggles (new case, status updates, payments, staff activity, daily digest)
  3. Security Settings: 2FA toggle, session timeout dropdown, force password reset toggle, IP whitelist input
  4. System Preferences: default priority dropdown, auto-assign toggle, require court date toggle, max cases input
  5. Danger Zone: export data button, delete test data button with confirmation
- Save button with snackbar confirmation (500ms simulated API call)
- OnPush change detection, signals-based state, reactive forms
- Full i18n with ADMIN.SETTINGS_* translation keys

## Files Changed
- `frontend/src/app/features/admin/settings/admin-settings.component.ts` — new file
