# Story AC-6: Admin Multi-Board Navigation

## Status: DONE

## Priority: P1

## Depends On: AC-2 (case detail), AC-3 (real data), AC-4 (operator Kanban)

## Description
Give the admin dashboard a tabbed multi-board navigation similar to what operators got in
CM-6, but tailored to admin oversight needs. The admin's primary navigation organizes cases
into four views: a traditional case list, the operator assignment Kanban, a status-based
Kanban, and a closed-case archive. Tab selection persists across page reloads.

## Design

### Tab Structure
```
┌─────────────────────────────────────────────────────────┐
│ [All Cases (142)] [By Operator] [By Status] [Archive]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  (Tab content varies by selection)                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Tab 1: All Cases (default)
- The existing `CaseManagementComponent` — case list with search, filters, expandable detail
- Enhanced with AC-5 workflow integration (valid status buttons)
- Click case number → navigates to `/admin/cases/:id` (AC-2)
- Shows operator name and attorney name in each row
- **Badge:** Total active case count

### Tab 2: By Operator (Operator Assignment Kanban)
- Embeds the `AdminOperatorKanbanComponent` from AC-4
- Columns = operators + Unassigned, drag to assign
- Primary tool for distributing workload
- **Badge:** Unassigned case count (highlights pending work)

### Tab 3: By Status
- Reuse the `OperatorKanbanComponent` from sprint 052 (CM-5)
- All cases across all operators, grouped by status phase (Intake → Assignment → Processing
  → Payment → Resolution)
- Drag-and-drop changes status (uses StatusWorkflowService validation)
- Admin sees ALL cases, not just their own
- **Badge:** In-progress case count

### Tab 4: Archive
- Read-only list of closed and resolved cases
- Search and date-range filtering
- No status change actions — view-only
- Click case → navigates to `/admin/cases/:id` in readonly mode
- **Badge:** Closed case count (last 30 days)

### Tab Persistence
- Active tab index stored in `localStorage` key `admin_active_tab`
- On component init, restore last active tab
- Use `effect()` to sync signal → localStorage (same pattern as CM-6)

### Lazy Loading
- Tab 1 (All Cases) loads on init (default view)
- Tabs 2, 3, 4 load data only on first activation to avoid unnecessary API calls
- Once loaded, data is cached in signals until explicit refresh

## Implementation

### Approach: Refactor Admin Dashboard
Rather than creating a new component, **refactor the admin dashboard** to incorporate the
multi-board tabs. The current dashboard has two sections: KPI tiles (top) and case queue
(bottom). The refactored layout:

```
┌─────────────────────────────────────────┐
│ KPI Tiles (always visible)              │
│ [Total] [Active] [Pending] [Resolved]   │
├─────────────────────────────────────────┤
│ [All Cases] [By Operator] [...] [...]   │
│ ─────────────────────────────────────── │
│ (Tab content)                           │
└─────────────────────────────────────────┘
```

KPI tiles remain above the tabs. Charts move to a collapsible "Analytics" section below the
tabs, or become a separate admin route (`/admin/analytics`).

### Modified Files
- `frontend/src/app/features/admin/dashboard/admin-dashboard.component.ts` — add
  `MatTabsModule`, tab signals, lazy loading, tab persistence. Embed
  `AdminOperatorKanbanComponent` in tab 2, `OperatorKanbanComponent` in tab 3.
- `frontend/src/app/features/admin/dashboard/admin-dashboard.component.spec.ts` — update
  tests for tabbed layout
- `frontend/src/app/features/admin/admin-routing.module.ts` — optional: route for
  standalone Kanban view at `/admin/operator-kanban`

### New Signals
```typescript
activeTab = signal(parseInt(localStorage.getItem('admin_active_tab') ?? '0', 10));
byOperatorLoaded = signal(false);
byStatusLoaded = signal(false);
archiveLoaded = signal(false);
archiveCases = signal<any[]>([]);
archiveSearch = signal('');
allCasesForStatusKanban = signal<any[]>([]);
```

### Tab Change Handler
```typescript
onTabChange(index: number): void {
  this.activeTab.set(index);
  if (index === 1 && !this.byOperatorLoaded()) {
    // AdminOperatorKanbanComponent loads its own data
    this.byOperatorLoaded.set(true);
  }
  if (index === 2 && !this.byStatusLoaded()) {
    this.loadAllCasesForStatusKanban();
    this.byStatusLoaded.set(true);
  }
  if (index === 3 && !this.archiveLoaded()) {
    this.loadArchive();
    this.archiveLoaded.set(true);
  }
}
```

### Status Kanban Integration (Tab 3)
The `OperatorKanbanComponent` expects a `cases` input. For admin:
- Fetch all active cases (all operators) via `GET /api/admin/cases?status=active`
- Pass as `[cases]="allCasesForStatusKanban()"` input
- Listen to `(caseUpdated)` output to refresh

### Archive Tab
- Fetch from `GET /api/admin/cases?status=closed,resolved&limit=100`
- Render as simple table: case number, customer, operator, attorney, closed date, resolution
- Search filters by case number or customer name (client-side)

## Non-Functional Requirements

### Accessibility
- `MatTabGroup` handles tab ARIA roles/keyboard automatically
- Tab labels include count badges with `aria-label` for screen readers
- Each tab panel's content has appropriate landmarks
- Tab 4 (Archive) table has proper `role="table"` and header scope

### Performance
- Only active tab fetches data (lazy)
- Tab 2 and 3 data is loaded once, cached until refresh
- Refresh button on each tab forces reload of that tab's data only
- No full-page reload when switching tabs

### Mobile
- Tabs are scrollable on narrow screens
- Tab badges remain visible (truncate label text first)

## Tests

### Unit Tests
- Default tab is 0 (All Cases) or restored from localStorage
- Tab change calls onTabChange with correct index
- Tab persistence writes to localStorage on change
- Tab 2 (By Operator) loads only on first activation
- Tab 3 (By Status) loads only on first activation
- Tab 4 (Archive) loads only on first activation
- Refresh re-fetches data for current tab
- Archive tab renders closed cases
- Archive search filters cases
- KPI tiles remain visible across all tabs
- Tab badges show correct counts
- Minimum 12 tests

## Acceptance Criteria
- [x] Dashboard shows 4 tabs: All Cases, By Operator, By Status, Archive
- [x] KPI tiles section remains visible above tabs on all views
- [x] Tab 1 (All Cases) shows the existing case list (with AC-5 workflow buttons)
- [x] Tab 2 (By Operator) embeds AdminOperatorKanbanComponent
- [x] Tab 3 (By Status) embeds OperatorKanbanComponent with all cases
- [x] Tab 4 (Archive) shows closed/resolved cases in read-only table
- [x] Tabs load data lazily on first activation
- [x] Active tab persists in localStorage across page reloads
- [x] Each tab has a count badge
- [x] Archive tab supports search filtering
- [x] Tabs are responsive and scrollable on mobile (Angular Material built-in scroll)
- [x] Unit tests pass with ≥12 test cases (31 tests pass)
- [x] Build succeeds with no errors
