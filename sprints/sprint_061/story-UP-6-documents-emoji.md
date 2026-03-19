# Story UP-6 — Documents Emoji Icon Incorporation

## Status: DONE

## Description
Ensure emoji icons are used in the Documents page redesign — file format tags, upload zone icon, and document type indicators.

## Files Modified
- `frontend/src/app/features/driver/documents/document-upload/document-upload.component.html`

## Key Changes
- Format tags use emoji: camera (Images), document (PDF), memo (Word), clipboard (Text)
- Upload zone uses inline SVG upload arrow instead of mat-icon
- Document cards use file-type-appropriate emoji indicators
- HTML entity encoding used in templates (e.g., `&#x1F4F7;`)

## Acceptance Criteria
- [x] File format tags display emoji icons
- [x] Upload zone has SVG upload indicator
- [x] Consistent with emoji design system established in UP-3/UP-4/UP-5
- [x] Build compiles cleanly
