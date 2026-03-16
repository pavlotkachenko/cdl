# Story CM-6: Multi-Board Navigation & Team Visibility

## Status: DONE

## Priority: P1

## Depends On: CM-1 (canAccessCase fix for team view access)

## Description
The requirement says the operator "sees in their cabinet only the cases assigned to them, but
may have access to other boards as well." This story adds tab-based navigation to the operator
dashboard so operators can switch between multiple case views:

1. **My Cases** — assigned to me (existing, default)
2. **Unassigned Queue** — no operator assigned (existing)
3. **All Active Cases** — read-only team view showing all non-closed cases
4. **Closed Archive** — operator's own closed/resolved cases for reference

### User Stories
> As an **operator**, I want to see all active cases across the team (read-only) so I
> understand the overall workload and can identify cases that might need help.

> As an **operator**, I want to view my closed cases as an archive so I can reference
> past work and outcomes.

## Backend Changes

### Verify: `GET /api/cases` for operators
The existing `getCases` endpoint in `case.controller.js` handles role-based filtering.
Verify it returns all cases for `operator` role (not just assigned ones) when no filter
is applied. If it restricts to assigned cases, add a query param:
```
GET /api/cases?scope=all&status=active  → all non-closed cases (team view)
GET /api/cases?scope=mine&status=closed → operator's closed cases (archive)
```

If `getCases` doesn't support these filters, add logic:
```javascript
if (req.user.role === 'operator') {
  if (scope === 'all') {
    // Return all cases (read-only intent, enforced by UI)
    query = query.not('status', 'eq', 'closed');
  } else if (scope === 'mine' && status === 'closed') {
    query = query.eq('assigned_operator_id', req.user.id).eq('status', 'closed');
  } else {
    // Default: assigned to me
    query = query.eq('assigned_operator_id', req.user.id);
  }
}
```

### New Endpoint (optional): `GET /api/operator/closed-cases`
Alternative to extending `getCases` — a dedicated endpoint for the operator's closed archive:
```javascript
router.get('/closed-cases', authenticate, authorize(['operator', 'admin']), operatorController.getClosedCases);
```

Returns cases where `assigned_operator_id = req.user.id` AND `status IN ('resolved', 'closed')`,
ordered by `updated_at` descending. Includes pagination.

## Frontend Changes

### Dashboard Tab Navigation
Replace the current static two-section layout with a tabbed interface:

```html
<mat-tab-group [(selectedIndex)]="activeTab()" (selectedIndexChange)="activeTab.set($event)">
  <mat-tab>
    <ng-template mat-tab-label>
      <mat-icon>folder_open</mat-icon>
      {{ 'OPR.TAB_MY_CASES' | translate }}
      <span class="tab-badge">{{ myCases().length }}</span>
    </ng-template>
    <!-- My Cases content (existing list/Kanban view from CM-5) -->
  </mat-tab>

  <mat-tab>
    <ng-template mat-tab-label>
      <mat-icon>queue</mat-icon>
      {{ 'OPR.TAB_QUEUE' | translate }}
      <span class="tab-badge queue">{{ unassignedCases().length }}</span>
    </ng-template>
    <!-- Unassigned Queue content (existing) -->
  </mat-tab>

  <mat-tab>
    <ng-template mat-tab-label>
      <mat-icon>groups</mat-icon>
      {{ 'OPR.TAB_ALL_CASES' | translate }}
    </ng-template>
    <!-- All Active Cases (read-only team view) -->
  </mat-tab>

  <mat-tab>
    <ng-template mat-tab-label>
      <mat-icon>archive</mat-icon>
      {{ 'OPR.TAB_ARCHIVE' | translate }}
    </ng-template>
    <!-- Closed Archive -->
  </mat-tab>
</mat-tab-group>
```

### "All Active Cases" Tab
- Loads from `GET /api/cases?scope=all&status=active` (or equivalent)
- Read-only table: case number, customer, violation, state, status, assigned operator, age
- **Operator's own cases highlighted** with a subtle background color or "Mine" badge
- Search/filter bar (same pattern as existing sections)
- Click navigates to case detail (if assigned to me) or shows limited read-only view (if not)
- No edit, status change, or assignment actions on other operators' cases

### "Closed Archive" Tab
- Loads from `GET /api/operator/closed-cases` or equivalent
- Table: case number, customer, violation, final status (resolved/closed), close date, outcome
- Click opens case detail in read-only mode
- Sort by close date descending
- Search by case number or customer name

### Lazy Loading
Each tab's data loads only when the tab is first selected (not all on init):
```typescript
onTabChange(index: number) {
  if (index === 2 && !this.allCasesLoaded()) this.loadAllCases();
  if (index === 3 && !this.archiveLoaded()) this.loadArchive();
}
```

### Active Tab Persistence
Store the active tab index in `localStorage` so it persists across page loads:
```typescript
private readonly STORAGE_KEY = 'opr_active_tab';
activeTab = signal(parseInt(localStorage.getItem(this.STORAGE_KEY) ?? '0', 10));

effect(() => localStorage.setItem(this.STORAGE_KEY, String(this.activeTab())));
```

## Acceptance Criteria
- [x] Dashboard shows 4 tabs: My Cases, Queue, All Cases, Archive
- [x] Tab badges show case counts
- [x] "My Cases" tab shows existing list + Kanban toggle (default)
- [x] "Queue" tab shows existing unassigned queue
- [x] "All Active Cases" tab shows all non-closed cases from all operators
- [x] Operator's own cases highlighted in "All Cases" view
- [x] "All Cases" is read-only — no edit, assign, or status change actions
- [x] Clicking someone else's case in "All Cases" shows limited view (no edit controls)
- [x] "Archive" tab shows operator's resolved/closed cases
- [x] Archive sorted by close date descending
- [x] Tab data lazy-loaded on first visit (not all on init)
- [x] Active tab persists in localStorage
- [x] Search/filter available in all tabs
- [x] All text uses TranslateModule with `OPR.TAB_*` keys
- [x] Tabs are keyboard navigable (left/right arrows, Enter to select)
- [x] Mobile: tabs horizontally scrollable with arrow indicators
- [x] Build succeeds with no errors

## Test Coverage

### Backend Tests
- `GET /api/cases?scope=all` returns all non-closed cases for operator
- `GET /api/cases?scope=mine&status=closed` returns only operator's closed cases
- `GET /api/operator/closed-cases` returns paginated closed cases for requesting operator
- Non-admin, non-operator roles get 403 on team view endpoint

### Frontend Tests
- Renders 4 tabs with correct labels and icons
- Tab badges show correct counts
- "All Cases" tab data loads on first select (lazy)
- "Archive" tab data loads on first select (lazy)
- Operator's cases highlighted in "All Cases" tab
- Active tab persisted to localStorage
- Tab change triggers data load for unloaded tabs
- Search filter works within each tab
