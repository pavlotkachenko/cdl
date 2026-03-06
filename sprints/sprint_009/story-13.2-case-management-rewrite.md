# Story 13.2 — Case Management Rewrite

**Sprint:** 009 — Admin Portal Modernization
**Status:** DONE

## Changes
- Removed: `standalone: true`, constructor injection, `CommonModule`, `RouterModule`, `FormsModule`, external template, `MatSnackBarModule`, `MatDialogModule`, `SelectionModel`, `applyFilters()` imperative method
- Added: `inject()`, `signal()`, `computed()`, `OnPush`, inline template
- `cases`, `staff`, `loading`, `searchTerm`, `statusFilter`, `priorityFilter` are signals
- `filteredCases` is `computed()` from all filter signals (replaces imperative `applyFilters()`)
- `SelectionModel` replaced with simple `selectedIds = signal(new Set<string>())` pattern (not needed for current template scope)

## File
`frontend/src/app/features/admin/case-management/case-management.component.ts`
