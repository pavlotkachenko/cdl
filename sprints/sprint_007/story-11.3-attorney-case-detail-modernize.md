# Story 11.3 — Attorney Case Detail Modernization

**Sprint:** 007
**Theme:** Attorney Portal Modernization

## What
Modernize `attorney-case-detail.component.ts` to full Angular 21. The component is mostly correct but retains legacy patterns.

## Changes
- Remove `Subject` / `takeUntil` destroy pattern
- Switch from `CaseService` to `AttorneyService`
- Move from external template to inline template
- Make `selectedStatus` a `signal<string>` instead of plain property
- Remove unused `CommonModule`, `RouterModule`, `FormsModule`

## Acceptance Criteria
- [ ] No `Subject`, no `takeUntil`, no `ngOnDestroy`
- [ ] Uses `AttorneyService` for all API calls
- [ ] `selectedStatus = signal('')`
- [ ] Inline template
- [ ] All existing behaviour preserved: load case, load docs, accept, decline, updateStatus, goBack
