# Story: NR-11 — Batch Select & Bulk Actions

**Sprint:** sprint_070
**Priority:** P2
**Status:** DONE

## User Story

As a driver with many notifications,
I want to select multiple notifications and perform bulk actions,
so that I can efficiently manage my notification inbox.

## Acceptance Criteria

- [x] Checkbox on each notification item (custom styled, teal when checked)
- [x] "Select All" toggle in toolbar (appears when any item selected, or always visible)
- [x] Bulk "Mark Read" button appears when items are selected (teal styling)
- [x] Bulk "Delete Selected" button appears when items are selected (red/danger styling)
- [x] Selection state managed via `signal<Set<string>>` (notification IDs)
- [x] Selection cleared after bulk action completes
- [x] Bulk mark-read calls service.markAsRead() for each selected, updates UI reactively
- [x] Bulk delete calls service.deleteNotification() for each selected, removes from list
- [x] Checkbox has `aria-label="Select notification: [title]"`
- [x] Bulk action toolbar has clear count: "3 selected"
- [x] Select All toggles between select-all and deselect-all

## Technical Notes

- Use `signal<Set<string>>` for selectedItems — use `new Set(existing)` pattern for mutations
- Bulk toolbar shows/hides via `@if (selectedItems().size > 0)`
- Checkboxes are custom-styled divs with role="checkbox" and aria-checked
- Keyboard: Space/Enter toggles checkbox
