# Story OC-5: Batch OCR Processing Tool

## Status: DONE

## Priority: P1

## Depends On: None (uses existing OCR service)

## Description
Build a batch OCR interface for operators to upload and process multiple ticket images at once
(TC-OPR-005). The existing `ocr.service.js` and `ocr.controller.js` handle single-ticket OCR.
This story adds a batch endpoint that processes multiple files and a frontend component that
shows per-file results.

### User Story
> As an **operator**, I want to upload 3+ ticket images at once and have them all processed
> by OCR, seeing the extraction results for each file, so I can efficiently intake a batch
> of tickets from a carrier or driver.

## Backend Changes

### New Endpoint: `POST /api/operator/batch-ocr`
Add to `operator.controller.js`:

```javascript
exports.batchOcr = async (req, res) => {
  // Accept multipart form with field name "tickets" (array of files)
  // For each file: call ocrService.extractTicketData(file.buffer)
  // Return array of results with per-file status
};
```

**Request:** `multipart/form-data` with field `tickets` (multiple files)
**Limits:** Max 10 files per batch, 10MB per file (same as single OCR)

**Response:**
```json
{
  "results": [
    {
      "filename": "ticket1.jpg",
      "success": true,
      "data": {
        "violation_type": "Speeding",
        "violation_date": "2026-02-15",
        "state": "TX",
        "county": "Harris",
        "fine_amount": 350,
        "court_date": "2026-04-10",
        "confidence": 0.87
      }
    },
    {
      "filename": "ticket2.jpg",
      "success": false,
      "error": "Could not extract text from image"
    }
  ],
  "summary": { "total": 3, "successful": 2, "failed": 1 }
}
```

**Multer config:** Use `upload.array('tickets', 10)` for batch.

**Route registration:**
```javascript
router.post(
  '/batch-ocr',
  authenticate,
  authorize(['operator', 'admin']),
  upload.array('tickets', 10),
  operatorController.batchOcr
);
```

### Processing Strategy
Process files **sequentially** (not parallel) to avoid overloading the OCR service. Use
`for...of` loop with `await`. If one file fails, continue processing the rest — collect
all results and return the aggregate.

## Frontend Changes

### New Component: `BatchOcrComponent`
**Path:** `frontend/src/app/features/operator/batch-ocr/batch-ocr.component.ts`

**Signals:**
- `files = signal<File[]>([])` — selected files
- `processing = signal(false)`
- `progress = signal(0)` — 0 to files.length (for progress bar)
- `results = signal<OcrResult[]>([])` — per-file results after processing
- `error = signal('')`

**Template sections:**
1. **Upload area** — drag-and-drop zone + file picker button. Shows selected files as
   a list with filename, size, thumbnail preview, and remove (×) button. Accepts
   `image/jpeg, image/png, application/pdf`. Max 10 files.
2. **Process button** — "Process All (N files)" — disabled when no files or processing.
   Shows progress bar during processing.
3. **Results section** — appears after processing:
   - Summary bar: "3 processed: 2 successful, 1 failed"
   - Per-file result cards:
     - **Success:** Green check + filename, extracted fields in a compact grid
       (violation type, date, state, fine, court date), confidence percentage,
       "Create Case" button to pre-fill case creation form
     - **Failure:** Red × + filename + error message + "Retry" button
4. **Bulk actions** — "Create All Cases" button (creates cases from all successful results)

**Drag-and-drop:**
Use native HTML5 drag events (`dragover`, `dragleave`, `drop`) with visual feedback
(border highlight). No external library needed.

### Routing Update
In `operator-routing.module.ts`:
```typescript
{
  path: 'batch-ocr',
  loadComponent: () => import('./batch-ocr/batch-ocr.component')
    .then(m => m.BatchOcrComponent)
}
```

### Dashboard Navigation
Add a "Batch OCR" action button or navigation item on the operator dashboard that links
to `/operator/batch-ocr`.

## Acceptance Criteria
- [ ] `POST /api/operator/batch-ocr` accepts up to 10 files and returns per-file OCR results
- [ ] Failed files don't block processing of remaining files
- [ ] Response includes summary with total, successful, failed counts
- [ ] Frontend drag-and-drop zone accepts JPEG, PNG, PDF files
- [ ] File picker also works as fallback (click to browse)
- [ ] Selected files shown as list with thumbnails and remove buttons
- [ ] "Process All" button triggers batch upload with progress bar
- [ ] Results show per-file extraction data for successful files
- [ ] Failed files show error message and retry button
- [ ] "Create Case" button on individual results pre-fills case creation
- [ ] All text uses TranslateModule with `OPR.OCR.*` keys
- [ ] Component is standalone, OnPush, signals-based
- [ ] 10MB per file and 10 files per batch limits enforced client-side
- [ ] WCAG 2.1 AA: upload zone keyboard accessible, results announced to screen readers
- [ ] Build succeeds with no errors

## Test Coverage

### Backend Tests (`backend/src/__tests__/operator.controller.test.js`)
- `batchOcr` processes multiple files and returns per-file results
- `batchOcr` continues processing after individual file failure
- `batchOcr` returns summary with correct counts
- `batchOcr` rejects request with >10 files (multer limit)
- `batchOcr` rejects non-image files
- `batchOcr` requires operator or admin role

### Frontend Tests (`batch-ocr.component.spec.ts`)
- Renders upload zone initially
- Files added via file input appear in list with remove buttons
- Remove button removes file from list
- "Process All" disabled when no files selected
- "Process All" calls batch OCR endpoint and shows progress
- Successful results show extracted fields
- Failed results show error message
- Summary bar shows correct counts
- Drag-and-drop adds files to list (simulate drag events)
