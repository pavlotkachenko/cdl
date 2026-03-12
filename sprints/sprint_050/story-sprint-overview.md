# Sprint 050 — Operator Profile & Notifications Pages

## Goal
Implement operator profile and notifications pages following the same patterns used by
attorney, carrier, and other roles. Replace placeholder routing with dedicated components.

## Stories

| # | Story | Status |
|---|-------|--------|
| OP-1 | Operator profile page (avatar, edit info, change password) | DONE |
| OP-2 | Operator notifications page (list, mark read, unread badge) | DONE |
| OP-3 | i18n keys for profile & notifications (en, es, fr) | DONE |
| OP-4 | Update operator routing to use new components | DONE |

## Files Changed

### Frontend (New)
- `frontend/src/app/features/operator/operator-profile/operator-profile.component.ts`
- `frontend/src/app/features/operator/operator-notifications/operator-notifications.component.ts`

### Frontend (Modified)
- `frontend/src/app/features/operator/operator-routing.module.ts` — notifications + profile routes now point to dedicated components
- `frontend/src/assets/i18n/en.json` — added OPR profile/notification keys (19 keys)
- `frontend/src/assets/i18n/es.json` — Spanish translations
- `frontend/src/assets/i18n/fr.json` — French translations
