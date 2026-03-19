# Story ST-9: Frontend — Cleanup Stale HTML File

## Status: DONE

## Description
Delete the stale `submit-ticket.component.html` file. The actual template is inline in the `.ts` file. The HTML file uses old Angular directives (`*ngIf`, `*ngFor`), references a non-existent `documentsForm`, and uses `matDatepicker` — none of which match the current implementation.

## Changes
- Delete: `frontend/src/app/features/driver/submit-ticket/submit-ticket.component.html`
- Verify no imports reference this file (component uses inline `template:`)

## Acceptance Criteria
- [ ] Stale HTML file deleted
- [ ] Component still works (uses inline template)
- [ ] No broken imports or references

## Files to Delete
- `frontend/src/app/features/driver/submit-ticket/submit-ticket.component.html`
