# Story OP-1: Operator Profile Page

## Status: DONE

## Description
Create an operator profile page following the same pattern as the attorney profile component.
Features: avatar upload, view/edit profile info, change password.

## Changes
- **`operator-profile/operator-profile.component.ts`**: New component
  - Avatar upload with file validation (5 MB max, JPEG/PNG/GIF/WebP)
  - Edit/View toggle for profile information (first name, last name, email, phone)
  - Reactive forms with validators
  - Password change with match validation
  - TranslateModule with OPR.* keys
  - OnPush change detection, signals, inject()

## Acceptance Criteria
- [x] Profile page shows user info (name, email, phone)
- [x] Edit mode allows updating name and phone
- [x] Password change form validates match
- [x] Avatar upload validates file type and size
- [x] All text uses OPR.* translation keys
- [x] Back button navigates to /operator/dashboard
