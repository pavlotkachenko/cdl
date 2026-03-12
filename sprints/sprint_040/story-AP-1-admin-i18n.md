# Story AP-1: Admin i18n — Add Translate Pipes to All Admin Components

**Status:** DONE

## Description
All admin portal components had hardcoded English strings in their templates. Added
TranslateModule and replaced all user-visible strings with `{{ 'ADMIN.*' | translate }}`
pipe expressions to support language switching.

## Changes
- Added 194 ADMIN.* translation keys to en.json, es.json, and fr.json
- All filter arrays refactored from `{ value, label }` to `{ value, key }` with ADMIN.* keys
- Label lookup methods renamed from `getXxxLabel()` to `getXxxKey()` returning translation keys
- Constant maps renamed from `XXX_LABELS` to `XXX_KEYS` containing ADMIN.* key strings
- Error signals store translation keys displayed via `{{ error() | translate }}`

## Files Changed
- `frontend/src/assets/i18n/en.json` — added ADMIN section (194 keys)
- `frontend/src/assets/i18n/es.json` — added ADMIN section (194 keys, Spanish)
- `frontend/src/assets/i18n/fr.json` — added ADMIN section (194 keys, French)
- `frontend/src/app/features/admin/dashboard/admin-dashboard.component.ts` — TranslateModule + pipes
- `frontend/src/app/features/admin/case-management/case-management.component.ts` — TranslateModule + pipes, STATUS_KEYS/PRIORITY_KEYS
- `frontend/src/app/features/admin/staff-management/staff-management.component.ts` — TranslateModule + pipes, ROLE_KEYS/STATUS_KEYS
- `frontend/src/app/features/admin/user-management/user-management.component.ts` — TranslateModule + pipes, ROLE_KEYS
- `frontend/src/app/features/admin/operator-dashboard/operator-dashboard.component.ts` — TranslateModule + pipes
