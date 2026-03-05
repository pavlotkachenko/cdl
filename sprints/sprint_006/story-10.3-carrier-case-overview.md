# Story 10.3 — Carrier Case Overview

**Epic:** Complete Carrier End-to-End Journey
**Priority:** HIGH
**Status:** TODO

## User Story
As Sarah (carrier),
I want to see all open tickets across my fleet in one screen with
filter chips (All / Active / Pending / Resolved),
so I can spot problems instantly without switching between drivers.

## Context
New component at `features/carrier/cases/carrier-cases.component.ts`.
Route: `/carrier/cases` (to be registered in `carrier-routing.module.ts`).

## Backend Endpoint
`GET /api/carriers/me/cases?status=<filter>` →
`{ cases: [{ id, case_number, driver_name, violation_type, state, status, attorney_name }] }`

## Component Behaviour
- `ngOnInit`: loads cases via `CarrierService.getCases()`
- Filter chips: All / Active / Pending / Resolved — filter `cases` signal client-side
- `filteredCases` computed signal applies active filter
- Each row shows: driver name, case number, violation type, state, status chip, attorney name
- Click a row → navigates to `/driver/cases/:id` (read-only view)
- Empty state per filter with descriptive message

## Acceptance Criteria
- [ ] Cases loaded via `CarrierService.getCases()`
- [ ] Filter chips update `filteredCases` computed signal
- [ ] Table/list shows all required columns
- [ ] Click navigates to case detail
- [ ] Empty state shown per filter
- [ ] Unit tests cover all paths (see Story 10.5)
