# Story 11.2 — Attorney Dashboard Rewrite (Angular 21)

**Sprint:** 007
**Theme:** Attorney Portal Modernization

## What
Full rewrite of `attorney-dashboard.component.ts` from legacy patterns (constructor injection, standalone: true, Chart.js, external template, Subject/takeUntil) to Angular 21.

## Current Problems
- Uses `constructor()` injection
- Sets `standalone: true` explicitly (violates Angular 21 convention)
- Imports Chart.js — adds bundle weight, breaks in test env
- External template file
- `Subject` / `takeUntil` destroy pattern

## New Design
- `inject()`, `signal()`, `computed()`, `ChangeDetectionStrategy.OnPush`, inline template
- 3-tab view: **Pending** (assigned_to_attorney) / **Active** (working) / **Resolved** (closed/resolved)
- Stat row: pending count, active count, resolved count — all computed from `cases` signal
- Accept/Decline from Pending tab with per-card loading state via `processingId` signal
- Uses `AttorneyService` (Story 11.1)

## Acceptance Criteria
- [ ] No `standalone: true`, no Chart.js, no external template
- [ ] `loading`, `cases`, `activeTab`, `processingId` signals
- [ ] `pendingCases`, `activeCases`, `resolvedCases` computed
- [ ] Accept removes card from pending; Decline removes and shows snackBar
- [ ] Click on case card navigates to `/attorney/cases/:id`
