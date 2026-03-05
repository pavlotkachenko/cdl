# Story 6.8 — Tests: ocr.service.js

**Epic:** Backend Test Coverage
**Priority:** HIGH
**Status:** DONE

## User Story
As a developer,
I want unit tests for the OCR text parser,
so that regex regressions don't silently extract wrong citation numbers or dates.

## Scope
`parseExtractedText` and `validateExtraction` are pure functions — no mocks needed.
`extractTicketData` wraps Tesseract; mock Tesseract to test orchestration.

- `parseExtractedText` — citation number patterns (CA-SPD-123, A1234567), date patterns (MM/DD/YYYY, MM-DD-YYYY), violation type, fine amount ($250, 250.00), court date, officer name + badge, driver license
- `validateExtraction` — valid result passes, missing citation lowers confidence, empty result returns invalid
- `extractTicketData` — Tesseract mocked: success returns structured result with rawText+confidence, Tesseract error propagates
- File: `backend/src/__tests__/ocr.service.test.js`

## Acceptance Criteria
- [ ] Citation number extracted from "Citation #: CA-SPD-123456"
- [ ] Violation date extracted from "Date: 01/15/2025" and "01-15-2025"
- [ ] Fine amount extracted as number from "$250.00" and "Total: 150"
- [ ] Court date extracted from "Court Date: 03/20/2025"
- [ ] Officer name extracted from "Officer: John Smith"
- [ ] `validateExtraction` returns invalid when no fields extracted
- [ ] `extractTicketData` throws when Tesseract throws
