# Story CD2-5 — Documents Section & Upload Zone

**Status:** TODO
**Priority:** P0

## Description

Redesign the documents section with a dashed upload zone and file size display for each document entry.

## Acceptance Criteria

- [ ] Upload zone uses dashed border styling with teal accent
- [ ] File size displayed for each document entry
- [ ] Guard against `doc.fileSize` being `undefined` in template (Hidden Req #2)
- [ ] Document list items use design system card styling
- [ ] Upload zone has appropriate hover/focus states
- [ ] No .ts file changes

## Files Modified

- `frontend/src/app/features/driver/case-detail/case-detail.component.scss`
- `frontend/src/app/features/driver/case-detail/case-detail.component.html`
