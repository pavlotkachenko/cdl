# Story 3.2 — Upload Progress Indicator

**Epic:** Loading States & Error Handling
**Priority:** HIGH
**Status:** DONE

## User Story
As a driver uploading a ticket photo,
I want to see a progress bar during upload,
so that I know the system is working and don't tap again.

## Scope
- Add `HttpEvent`-based upload progress in the OCR/file upload flow
- Progress bar visible in `ticket-upload-wizard.component` during file POST
- Show "Processing..." spinner after upload completes while OCR runs

## Acceptance Criteria
- [ ] Progress bar appears immediately when file upload begins
- [ ] Progress updates to 100% on transfer complete
- [ ] "Processing ticket..." spinner shown while awaiting OCR response
- [ ] Upload errors shown with actionable message ("Upload failed — tap to retry")
