# Story 6.11 — Tests: storage.service.js

**Epic:** Backend Test Coverage
**Priority:** MEDIUM
**Status:** DONE

## User Story
As a developer,
I want unit tests for the storage service,
so that Supabase storage errors are correctly surfaced and file paths are constructed correctly.

## Scope
- `uploadToSupabase` — success returns path+bucket, Supabase error throws with message
- `generateSignedUrl` — success returns signedUrl string, error throws
- `getPublicUrl` — sync, returns publicUrl from Supabase response
- `deleteFromSupabase` — success resolves, error throws
- `deleteMultipleFiles` — success resolves, error throws
- File: `backend/src/__tests__/storage.service.test.js`

## Acceptance Criteria
- [ ] `uploadToSupabase` returns `{ path, fullPath, bucket }` on success
- [ ] `uploadToSupabase` throws with "Upload failed: <message>" on Supabase error
- [ ] `generateSignedUrl` returns the signedUrl string
- [ ] `generateSignedUrl` throws with "Failed to generate signed URL" on error
- [ ] `deleteFromSupabase` throws with "Delete failed" on Supabase error
- [ ] Folder path is prepended to filename: `cases/123/file.pdf`
