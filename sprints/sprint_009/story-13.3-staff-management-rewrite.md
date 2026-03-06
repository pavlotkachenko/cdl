# Story 13.3 — Staff Management Rewrite

**Sprint:** 009 — Admin Portal Modernization
**Status:** DONE

## Changes
- Removed: `standalone: true`, constructor injection, `CommonModule`, `RouterModule`, `FormsModule`, external template, `MatSnackBarModule`, `MatDialogModule`, `MatProgressBarModule`, `applyFilters()` imperative method
- Added: `inject()`, `signal()`, `computed()`, `OnPush`, inline template
- `staff`, `loading`, `searchTerm`, `roleFilter`, `statusFilter` are signals
- `filteredStaff` is `computed()` from all filter signals

## File
`frontend/src/app/features/admin/staff-management/staff-management.component.ts`
