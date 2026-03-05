# Story 7.1 — OCR-Powered Ticket Pre-fill

**Epic:** Core Flow Integration
**Priority:** CRITICAL
**Status:** DONE

## User Story
As Miguel (driver),
I want the system to automatically read my ticket photo and fill in the form,
so that I don't have to manually type citation numbers, dates, or fine amounts.

## Context
The `ocr.service.js` → `extractTicketData` backend function already exists and is tested.
The `ticket-upload-wizard` frontend component exists at `frontend/src/app/features/driver/ticket-upload-wizard/`.
The gap is: photo is uploaded but OCR is never called and extracted data never pre-fills the form.

## Scope

### Backend
- Add `POST /api/ocr/extract` endpoint (controller + route) that accepts a file buffer and returns `extractedData`
- Wire to existing `extractTicketData` in `ocr.service.js`
- Secure with JWT auth middleware

### Frontend (`ticket-upload-wizard`)
- After photo selected/captured, POST file to `/api/ocr/extract`
- Show skeleton loader while OCR runs ("Reading your ticket…")
- On success: pre-fill form fields from `extractedData`
  - Citation number, violation date, fine amount, court date, officer name, state
- Show confidence indicator per field (low confidence → yellow highlight + "Please verify")
- Allow driver to correct any pre-filled field before submitting
- On OCR failure: show "Couldn't read the ticket — please fill in manually" and proceed to manual form

## Acceptance Criteria
- [ ] Uploading a photo triggers a POST to `/api/ocr/extract`
- [ ] Form fields are pre-populated from `extractedData` within 5 seconds of upload
- [ ] Low-confidence fields are visually flagged for driver review
- [ ] Driver can edit any pre-filled field before submitting
- [ ] If OCR fails or returns empty, form falls back to fully manual entry (no crash)
- [ ] OCR endpoint is protected by JWT auth middleware
- [ ] Loading skeleton shows while OCR is processing (not a blank wait state)
