# Story 7.9 — Case Document Upload (Driver)

**Epic:** Core Flow Integration
**Priority:** HIGH
**Status:** TODO

## User Story
As Miguel (driver),
I want to upload additional documents to my case (police report, insurance, CDL copy),
so that my attorney has everything needed without me emailing files separately.

## Context
`storage.service.js` → `uploadToSupabase` and `storeFileMetadata` exist and are tested.
The case status page (Story 7.3) will link to this via a "Documents" section.
Attorney can download these files via signed URLs (Story 7.7).

## Scope

### Backend
- `POST /api/cases/:caseId/documents` — multipart file upload
  - Validates: file size ≤ 10MB, MIME type in `['image/jpeg','image/png','application/pdf','image/heic']`
  - Calls `uploadToSupabase(buffer, fileName, mimeType, folder = 'cases/{caseId}')`
  - Calls `storeFileMetadata` to persist record in `case_documents` table
  - Returns `{ id, fileName, fileSize, mimeType, uploadedAt, signedUrl }`
- `GET /api/cases/:caseId/documents` — list driver's documents for a case
  - Returns array of `{ id, fileName, fileSize, mimeType, uploadedAt }`
- `DELETE /api/cases/:caseId/documents/:documentId` — soft-delete, calls `deleteFromSupabase`
  - Only the driver who uploaded can delete; attorney cannot delete driver's files
- RLS: driver can only upload/list/delete their own case documents

### Frontend — Documents section within case status page (`/driver/cases/:caseId`)

**Documents card:**
- "Documents" section on the case status page (not a separate route)
- Upload zone: drag-and-drop on desktop, "Choose file" button on mobile
- Accepted formats label: "PDF, JPG, PNG, HEIC — max 10MB"
- Upload progress bar per file (using `HttpClient` with `reportProgress`)

**Document list:**
- Each file: icon (PDF or image), file name, size, upload date, delete icon (trash)
- Delete prompts a confirmation ("Remove this document?") before calling API
- Max 10 documents per case (show "Maximum 10 files reached" if limit hit)

**Validation (client-side, mirrors server):**
- Reject files over 10MB before upload with inline error
- Reject disallowed file types with inline error

## Acceptance Criteria
- [ ] Driver can upload PDF, JPG, PNG, HEIC files up to 10MB
- [ ] Upload progress bar visible during file transfer
- [ ] Files stored in Supabase under path `cases/{caseId}/{fileName}`
- [ ] Uploaded files listed with name, size, and upload date
- [ ] Driver can delete their own uploaded documents
- [ ] Files over 10MB are rejected client-side before upload attempt
- [ ] Invalid file types rejected with a clear message
- [ ] Attorney can download the files (signed URL — covered in Story 7.7)
- [ ] Maximum 10 documents enforced with clear UI message at the limit
