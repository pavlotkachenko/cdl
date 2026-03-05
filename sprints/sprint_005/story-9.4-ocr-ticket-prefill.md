# Story 9.4 — OCR Ticket Pre-fill

**Epic:** Complete Driver End-to-End Journey
**Priority:** HIGH
**Status:** DONE (service + wizard pre-exist, needs frontend service tests)

## User Story
As Miguel (driver),
I want the system to read my ticket automatically after I upload a photo,
so I don't have to type in violation type, date, state, or fine amount by hand.

## Context
`OcrService` (frontend) exists at `core/services/ocr.service.ts`.
`TicketUploadWizardComponent` imports and calls `ocrService.processTicketImage(file)` in
`processWithOCR()`, then patches `ocrReviewForm` with the extracted data.

Backend endpoint: `POST /api/ocr/extract` (multipart) → `{ success, data: OCRResult }`.

## OcrService API (what exists)
- `processTicketImage(file: File): Observable<OCRResult>` — POST `/api/ocr/extract`
- `getConfidenceLevel(confidence: number): { label, color, icon }` — pure function
- `validateOCRData(data): OCRValidationError[]` — pure function
- `getViolationTypes(): Observable<string[]>` — GET `/api/violations/types`
- `getStates(): Observable<Array<{code, name}>>` — GET `/api/states`

## Acceptance Criteria
- [ ] `processTicketImage` sends multipart POST to `/api/ocr/extract` with `ticket` field
- [ ] Response is mapped to `OCRResult` shape (`success`, `confidence`, `extractedData`, `rawText`)
- [ ] `getConfidenceLevel(0.9)` returns `{ label: 'High', ... }`
- [ ] `getConfidenceLevel(0.6)` returns `{ label: 'Medium', ... }`
- [ ] `getConfidenceLevel(0.3)` returns `{ label: 'Low', ... }`
- [ ] `validateOCRData` returns errors for missing required fields
- [ ] Unit tests cover all OcrService methods (see Story 9.5)
