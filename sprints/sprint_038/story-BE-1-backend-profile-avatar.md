# Story BE-1: Backend User Profile & Avatar Endpoints

**Status:** DONE

## Description
Add backend API endpoints for user profile updates and avatar image upload/replacement.
Profile endpoint accepts name and phone updates. Avatar endpoint handles image upload to
Supabase storage with old avatar cleanup.

## Acceptance Criteria
- [x] `PUT /api/users/profile` updates user name and phone
- [x] `POST /api/users/me/avatar` uploads avatar image to Supabase storage
- [x] Avatar upload validates file type (JPG, PNG, GIF, WebP) and size (max 5 MB)
- [x] Old avatar deleted from storage when replaced
- [x] Both endpoints require authentication

## Files Changed
- `backend/src/routes/user.routes.js` — added PUT /profile and POST /me/avatar endpoints
