# Story CL-2: Frontend — Remove Stale Duplicate Files

**Status:** DONE
**Priority:** P0
**Sprint:** 057

## Description
Remove duplicate, backup, and stale files from the frontend that were bloating the repo and causing potential import confusion.

## Files/Directories Removed
### Backup files (7 files)
- `frontend/src/app/core/layout/layout.component.html.backup`
- `frontend/src/app/features/auth/register/register.component.ts.bak`
- `frontend/src/app/features/driver/tickets/*.backup` (3 files)
- `frontend/src/app/features/driver/driver-routing.module.ts.backup`
- `frontend/src/styles.scss.bak`

### Stale route configuration
- `frontend/src/app/app-routing.module.ts` — duplicate of `app.routes.ts`, only referenced by unused `app.config.ts`

### Stale directories (entire trees)
- `frontend/src/app/landing-page/` (~60+ files) — unused legacy landing page module
- `frontend/src/app/auth/carrier-signup/` — stale carrier signup component
- `frontend/src/app/app/` — misplaced copy of driver dashboard
- `frontend/src/app/src/` — artifact directory with only `.DS_Store`

### Unused services
- `frontend/src/app/services/dashboard.service.ts` — unused (revenue.service.ts and subscription.service.ts kept)
- `frontend/src/services/messagingService.ts` — stale root-level service

## Fixes Applied
- `app.config.ts` import updated: `app-routing.module` → `app.routes` (prevents broken import after deletion)

## Verification
- [x] `ng build` succeeds with no errors
- [x] No imports reference deleted files
- [x] Active landing component at `features/landing/` is unaffected
- [x] All tests that were passing before still pass

## Acceptance Criteria
- [x] No `.bak` or `.backup` files anywhere in `frontend/src/`
- [x] No duplicate route configuration files
- [x] No stale/unused module directories
- [x] Build passes cleanly
