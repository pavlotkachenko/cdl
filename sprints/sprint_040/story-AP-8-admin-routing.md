# Story AP-8: Admin Routing — Add Notifications and Documents Routes

**Status:** DONE

## Description
The /admin/notifications and /admin/documents URLs were redirecting to the dashboard because
no routes existed. Added lazy-loaded routes for both new components.

## Changes
- Added `notifications` route → lazy loads AdminNotificationsComponent
- Added `documents` route → lazy loads AdminDocumentsComponent
- Fixed UpperCasePipe missing import in AdminDocumentsComponent (build error)

## Files Changed
- `frontend/src/app/features/admin/admin-routing.module.ts` — 2 new routes
- `frontend/src/app/features/admin/documents/admin-documents.component.ts` — added UpperCasePipe import
