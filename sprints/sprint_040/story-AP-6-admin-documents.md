# Story AP-6: Admin Documents Page

**Status:** DONE

## Description
Created a new admin documents page following the carrier documents pattern, with mock
document data, category filters, and file type icons.

## Changes
- New AdminDocumentsComponent with OnPush change detection and signals
- 12 mock documents across 5 categories: Legal, Court Filings, Client Documents, Internal, Templates
- 6 file type icons with distinct colors: PDF (red), DOCX (blue), XLSX (green), CSV (teal), Image (amber), ZIP (purple)
- Category filter buttons with active state highlighting
- Upload button placeholder
- Download button per document with accessible aria-label
- Responsive layout with mobile breakpoint at 480px
- Full i18n with ADMIN.* translation keys (CAT_ALL, CAT_LEGAL, etc.)

## Files Changed
- `frontend/src/app/features/admin/documents/admin-documents.component.ts` — new file
