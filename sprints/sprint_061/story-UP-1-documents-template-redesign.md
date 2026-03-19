# Story UP-1 — Documents Page Template Redesign

## Status: DONE

## Description
Redesign the Driver Documents page HTML templates (parent container, document-upload, documents-list) to match the new HTML design template with modern card-based layout, drag-and-drop upload zone, and design token compliance.

## Files Modified
- `frontend/src/app/features/driver/documents/documents.component.html`
- `frontend/src/app/features/driver/documents/document-upload/document-upload.component.html`
- `frontend/src/app/features/driver/documents/documents-list/documents-list.component.html`

## Acceptance Criteria
- [x] Documents parent uses page-header pattern with label/title/subtitle
- [x] Upload component has drag-and-drop zone with visual feedback
- [x] Documents list uses card grid layout with file type indicators
- [x] Emoji icons for file format tags (camera, document, text, clipboard)
- [x] Inline SVGs for functional icons (upload arrow, close, download)
- [x] Design tokens from `_variables.scss` used throughout
- [x] Mobile-responsive layout
