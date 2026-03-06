# Story 20 — Operator Dashboard Enhancements

**Sprint:** 016 — Operator Dashboard Enhancements
**Status:** DONE

## Scope

Bulk case selection + bulk assign, status filter tabs, priority badges on aged cases.

## Changes

### 20.1 `operator-dashboard.component.ts` — UPDATED

**New signals:**
| Signal | Type | Purpose |
|---|---|---|
| `statusFilter` | `signal<StatusFilter>('new')` | Active queue filter |
| `selectedCaseIds` | `signal<Set<string>>(new Set())` | Bulk selection set |
| `bulkAttorneyId` | `signal('')` | Attorney for bulk assign |
| `bulkPrice` | `signal('')` | Fee for bulk assign |
| `bulkAssigning` | `signal(false)` | Bulk assign in-flight state |

**New computed:**
- `selectedCount` — size of selection set
- `allSelected` — true when all visible cases are selected
- `someSelected` — true when a strict subset is selected (drives checkbox indeterminate state)

**New methods:**
- `setStatusFilter(status)` — updates filter, clears selection, reloads queue
- `toggleSelect(id)` — adds/removes case from `selectedCaseIds` (immutable set replacement)
- `toggleAll()` — selects all or deselects all
- `clearSelection()` — empties selection
- `bulkAssign()` — `forkJoin()` across all selected cases → snackBar count on success
- `getAgePriority(hours)` — returns `'urgent'` (≥48h), `'warning'` (≥24h), or `''`

**Updated:**
- `load()` now passes `this.statusFilter()` to `getOperatorCases()` (default `'new'`)
- `STATUS_TABS` constant defines the 3 filter options (New / Under Review / Waiting for Driver)

### 20.2 Template additions
- **Status filter tab group** (`role="group"`) — mat-flat-button for each STATUS_TAB with `color="primary"` when active
- **Select-all bar** with `mat-checkbox` showing indeterminate state and selected count
- **Bulk action bar** (blue, `#e3f2fd`) — appears when `selectedCount() > 0`; contains attorney select, fee input, "Assign All" button, Clear button
- **Per-row checkboxes** — `mat-checkbox` with `aria-label="Select case CDL-XXX"`
- **Priority badges** — "Urgent" badge (red) for ≥48h cases, "Attention" badge (orange) for ≥24h

### 20.3 New imports added
- `MatCheckboxModule` (for per-row + select-all checkboxes)
- `forkJoin` from `rxjs` (for parallel bulk assign calls)

## Spec Updates (`operator-dashboard.component.spec.ts`)

Old: 13 tests. New: 29 tests (+16).

### New test groups

**Status filter (2 tests):**
- setStatusFilter updates statusFilter and reloads with new status
- setStatusFilter clears selection

**Bulk selection (6 tests):**
- toggleSelect adds/removes case
- toggleAll selects all / deselects all
- someSelected is true for partial selection
- clearSelection empties set

**Bulk assign (5 tests):**
- calls assignToAttorney for each selected case (forkJoin)
- clears selection + resets form on success
- shows count in success snackBar
- shows error snackbar on invalid price
- does nothing when no cases selected

**Priority badges (3 tests):**
- getAgePriority returns 'urgent' for 48+ hours
- getAgePriority returns 'warning' for 24-47 hours
- getAgePriority returns '' for under 24 hours

## Total
388/388 tests pass (was 372 before Sprint 016, +16 new tests).
