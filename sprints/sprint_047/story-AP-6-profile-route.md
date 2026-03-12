# Story AP-6: Attorney Profile — Create Profile Page and Fix Redirect

**Status:** DONE

## Description
The sidebar navigation pointed to `/attorney/profile` but no such route existed — the empty path fallback redirected to `/attorney/dashboard`. Created a new `AttorneyProfileComponent` with:
- Avatar upload
- Profile information form (first name, last name, email, phone, bar number, firm name)
- Change password section
- Back button navigating to `/attorney/dashboard`

Added the `profile` route to `attorney-routing.module.ts`.

## Files Changed
- `frontend/src/app/features/attorney/attorney-profile/attorney-profile.component.ts` — new file
- `frontend/src/app/features/attorney/attorney-routing.module.ts` — added profile route
- `frontend/src/assets/i18n/en.json` — added profile-related ATT keys (PROFILE_INFO, FIRST_NAME, LAST_NAME, etc.)
