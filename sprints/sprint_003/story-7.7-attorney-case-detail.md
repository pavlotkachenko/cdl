# Story 7.7 — Attorney Case Detail View

**Epic:** Core Flow Integration
**Priority:** HIGH
**Status:** TODO

## User Story
As James (attorney),
I want to see the full case details — ticket photo, OCR data, driver info, and documents — in one view,
so that I have everything I need to build a defense without asking the driver to resend anything.

## Context
After accepting a case (Story 7.6), attorney needs a working case detail view.
The backend storage service and document model exist. OCR data is stored on the case record.
A `GET /api/cases/:caseId` endpoint is assumed to exist or will be extended.

## Scope

### Backend
- `GET /api/cases/:caseId` — extend to include:
  - `extractedOcrData` (citation number, violation date, fine, officer, state)
  - `documents[]` with signed download URLs (via `generateSignedUrl` from `storage.service.js`)
  - `driver` (first name, CDL number, phone — masked except last 4 digits)
  - `conversation` id if exists
- RLS: attorney can only fetch cases where `assigned_attorney_id = auth.uid()`
- `PATCH /api/cases/:caseId/status` — attorney can update status to `in_progress`, `pending_court`, `pending_client`, `resolved`

### Frontend (route: `/attorney/cases/:caseId`)

**Header:**
- Case number, status badge, violation type
- "Back to Queue" breadcrumb

**Sections (tabbed on mobile, side-by-side on tablet+):**

*Tab 1 — Ticket Details:*
- Ticket photo thumbnail (tap to expand full-screen)
- OCR extracted fields in a clean table: Citation #, Date, Violation Type, Fine Amount, Court Date, Officer, State
- "Unreadable field" placeholder for nulls

*Tab 2 — Driver Info:*
- Driver first name, CDL number (masked: `****1234`)
- "Message Driver" button → navigates to conversation (Story 7.9 or existing messages)

*Tab 3 — Documents:*
- List of uploaded files with file name, size, upload date
- Download button per file (uses signed URL)
- No upload from attorney side in this story (V2)

**Status update panel:**
- Dropdown to change case status (constrained to valid transitions)
- "Update Status" button → `PATCH /api/cases/:caseId/status`
- Success toast: "Status updated to [new status]"

## Acceptance Criteria
- [ ] Attorney can view OCR-extracted ticket fields for their assigned cases
- [ ] Ticket photo visible with tap-to-expand on mobile
- [ ] All uploaded documents listed with working signed download URLs
- [ ] Attorney can change case status via dropdown (valid transitions only)
- [ ] Attorney cannot view cases assigned to other attorneys (403)
- [ ] "Message Driver" button routes to the correct conversation
- [ ] Null OCR fields shown as "Not extracted" placeholder (not blank or crashed)
