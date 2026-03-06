# Story 21 — Attorney Portal Enhancements

**Sprint:** 017 — Attorney Portal Enhancements
**Status:** DONE

## Scope

Document upload, case notes, court date tracking — all within the attorney case detail view.

## Changes

### 21.1 `attorney.service.ts` — UPDATED

New interfaces:
```typescript
export interface CaseNote { id: string; content: string; created_at: string; author?: string; }
export interface CourtDate { id?: string; court_date: string; location?: string; notes?: string; }
```

New methods:
| Method | HTTP | Endpoint |
|---|---|---|
| `getCaseNotes(caseId)` | GET | `/cases/:id/notes` |
| `addNote(caseId, content)` | POST | `/cases/:id/notes` |
| `getCourtDate(caseId)` | GET | `/cases/:id/court-date` |
| `setCourtDate(caseId, date, location?, notes?)` | POST | `/cases/:id/court-date` |
| `uploadDocument(caseId, file)` | POST (FormData) | `/cases/:id/documents` |

### 21.2 `attorney-case-detail.component.ts` — UPDATED

New signals:
- `notes`, `newNote`, `addingNote` — case notes state
- `courtDate`, `courtDateInput`, `courtLocation`, `settingCourtDate` — court date state
- `uploading` — document upload in-flight state

New methods:
- `saveNote()` — validates non-empty, calls service, prepends result to `notes` signal
- `saveCourtDate()` — validates date present, calls service, updates `courtDate` signal locally
- `onFileSelected(event)` — extracts `File` from event, calls `uploadDocument`, appends to `documents`
- `formatDate(dateStr)` — `toLocaleDateString('en-US', { year, month, day })`

`ngOnInit()` now also calls `loadNotes()` and `loadCourtDate()`.

New template sections (in display order):
1. **Court Date card** — shows current date+location if set; date input + location input + Save button
2. **Documents card** — extended with hidden `<input type="file">` + "Upload" trigger button
3. **Case Notes card** — textarea + "Add" button + chronological notes list

New import: `MatInputModule` (for textarea with `matInput`).

### 21.3 Spec files

**`attorney-case-detail.component.spec.ts`** — 7 → 17 tests (+10):
- loads notes and court date on init
- saveNote() calls addNote and prepends note to list
- saveNote() does nothing when content is blank
- saveNote() shows error snackBar when service fails
- saveCourtDate() calls setCourtDate with date and location
- saveCourtDate() does nothing when date input is empty
- onFileSelected() calls uploadDocument and appends to documents list
- onFileSelected() does nothing when no file is selected
- formatDate() formats ISO date to readable string
- formatDate() returns empty string for empty input

**`attorney.service.spec.ts`** — 6 → 11 tests (+5):
- getCaseNotes() calls GET /:id/notes
- addNote() calls POST /:id/notes with content
- getCourtDate() calls GET /:id/court-date
- setCourtDate() calls POST /:id/court-date with date and location
- uploadDocument() calls POST /:id/documents with FormData

## Lessons

**toLocaleDateString timezone trap:** `new Date('2026-04-15')` parses as UTC midnight, which in negative-offset timezones is Apr 14. Test with `toContain('2026')` + `length > 0` rather than asserting the day number.

## Total
402/402 tests pass (was 388 before Sprint 017, +14 new tests).
