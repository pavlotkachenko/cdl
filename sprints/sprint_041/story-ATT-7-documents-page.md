# Story ATT-7: Attorney Documents Page

**Status:** DONE

## Description
Created a documents management page with file listing, type filtering, search, upload button, and document actions.

## Changes
- Document table: name, type, case, size, uploaded by, date
- Type filter: Ticket Photo, Court Document, Evidence, Contract, Invoice, Other
- Search bar for document name/case
- Upload document button (UI only)
- Per-document actions: download, preview, delete
- Type badges with icons and colors
- 10 mock documents linked to cases
- Full i18n with ATT.* keys
- OnPush change detection, signals-based state

## Files Changed
- `frontend/src/app/features/attorney/attorney-documents/attorney-documents.component.ts` — new file
