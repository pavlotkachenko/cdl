# Story: DP-8 — Backend: Bio Column + Extended Profile Update

**Sprint:** sprint_069
**Priority:** P0
**Status:** DONE

## User Story

As a developer,
I want the backend to support saving bio, CDL number, and CDL state in the profile update endpoint,
So that the redesigned profile page can persist all user fields.

## Scope

### Files to Create
- `backend/src/migrations/017_user_bio.sql`

### Files to Modify
- `backend/src/controllers/user.controller.js` (or inline route handler in `user.routes.js`)
- `backend/src/__tests__/user.profile.test.js` (create or extend)

### Database Changes
- `ALTER TABLE users ADD COLUMN bio TEXT DEFAULT NULL`
- `ALTER TABLE users ADD COLUMN cdl_number VARCHAR(50) DEFAULT NULL` (if not exists)
- `ALTER TABLE users ADD COLUMN cdl_state VARCHAR(2) DEFAULT NULL` (if not exists)

## Acceptance Criteria

### Migration
- [x] Migration file `017_user_bio.sql` created
- [x] Adds `bio TEXT` column to `users` table (nullable, default null)
- [x] Adds `cdl_number VARCHAR(50)` if not already present
- [x] Adds `cdl_state VARCHAR(2)` if not already present
- [x] Migration is idempotent (uses `IF NOT EXISTS` or `ADD COLUMN IF NOT EXISTS`)

### Profile Update Endpoint
- [x] `PUT /api/users/profile` accepts additional fields: `bio`, `cdl_number`, `cdl_state`
- [x] Bio is sanitized (strip HTML tags, trim whitespace)
- [x] Bio max length: 500 characters (validated server-side)
- [x] CDL state validated: 2-letter US state code or empty
- [x] CDL number: alphanumeric, max 50 chars
- [x] Returns updated user object including new fields
- [x] Existing `name` and `phone` fields continue to work unchanged

### Tests
- [x] Test: update profile with bio field
- [x] Test: update profile with cdl_number and cdl_state
- [x] Test: bio over 500 chars returns 400
- [x] Test: invalid cdl_state returns 400
- [x] Test: existing name/phone update still works

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `user.controller.js` / `user.routes.js` | `user.profile.test.js` | this story |

## Dependencies

- Depends on: none
- Blocked by: none

## Notes

- Check `supabase_schema.sql` for existing `cdl_number` / `cdl_state` columns before adding
- The `users` table may already have these columns from the original schema — verify first
- Migration numbering: latest is `016_webauthn_credentials.sql`, so this is `017`
- Bio sanitization: use a simple regex to strip `<tags>`, don't add a new dependency
- The `AuthService.updateProfile()` on the frontend will need to send the new fields — handled in DP-1
