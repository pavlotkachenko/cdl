# Sprint 054 — Comprehensive Case Table View

## Goal
Deliver a **shared, full-featured case table** as a **new, additional view** for both admin and
operator roles. This does **not** replace any existing dashboards, card views, or Kanban boards —
it is a brand-new "Case Table" page accessible from the sidebar alongside existing navigation.
The table displays all 19 business-critical columns with tiered column visibility, server-side
sorting/filtering/pagination, global search, expandable row detail, and a responsive mobile card
fallback — all accessible to both admin and operator roles with appropriate data scoping.

## Context & Relationship to Prior Sprints
Sprint 052 built operator case management tools (inline editing, file manager, status pipeline,
Kanban). Sprint 053 added admin parity — admin case detail, operator assignment Kanban, dashboard
real data integration, and admin status workflow.

**What's missing:** Both roles currently view cases through **card-based layouts** optimized for
small datasets. As the case count grows, admins and operators also need a dense, scannable,
sortable table that shows all 19 key business fields at a glance — the kind of view you'd
expect in a CRM or ERP system. The existing card views, dashboards, and Kanban boards remain
untouched and fully functional; the new table is an **additional** navigation option.

**Key insight:** The 19-column requirement exceeds typical viewport width (~1900px at minimum).
The UX strategy uses **tiered column groups** (Core / Case Info / Assignment / Contact /
Financial / Meta) with sensible defaults so only ~10 columns show initially, with a column
toggle for power users to reveal more. Sticky first two columns, expandable row detail, and a
density selector complete the experience.

## Scope
- **Backend:** Extend `GET /api/admin/cases` to return all 19+ fields with JOINs, add `state`
  and `carrier` filter params, add `sort_by`/`sort_dir` params, add file count subquery; new
  `GET /api/operator/all-cases` endpoint with same capabilities but operator-scoped visibility
- **Frontend:** 1 new shared component (`CaseTableComponent`), 1 new shared component
  (`ColumnToggleComponent`), new `AdminCaseTableComponent` wrapper page, new
  `OperatorAllCasesComponent` wrapper page — all additive, no existing views modified
- **UX:** Column group toggles, density selector, sticky columns, expandable row detail, mobile
  card layout, horizontal scroll indicators
- **Testing:** Co-located `.spec.ts` for every new component/service, backend Jest tests for
  modified endpoints
- **i18n:** ~55 new translation keys across en/es/fr for column headers, controls, messages

## Stories

| # | Story | Priority | Status |
|---|-------|----------|--------|
| CT-1 | Backend: extend case listing APIs with all 19 fields, filters, sorting & pagination | P0 | TODO |
| CT-2 | Shared CaseTableComponent: core MatTable with 19 columns, sort & paginate | P0 | TODO |
| CT-3 | Column visibility controls & density selector with localStorage persistence | P1 | TODO |
| CT-4 | Global search, filter chips & expandable row detail panel | P1 | TODO |
| CT-5 | Admin & operator new route + sidebar integration with role-based column defaults | P1 | TODO |
| CT-6 | Responsive design: mobile card layout, scroll indicators & breakpoint handling | P2 | TODO |
| CT-7 | i18n, accessibility & comprehensive test coverage | P2 | TODO |

## Architecture Decisions

### Shared Component Strategy
The `CaseTableComponent` lives in `features/shared/case-table/` and is imported by both admin
and operator feature modules. It receives data via `input()` signals and emits actions via
`output()`. The parent (admin or operator) owns the data source and API calls — the table is a
pure presentation component.

### Server-Side vs Client-Side Processing
- **Pagination:** Server-side (cases can number in thousands)
- **Sorting:** Server-side (ORDER BY in SQL for consistent results across pages)
- **Filtering:** Server-side (WHERE clauses hit indexed columns)
- **Search:** Server-side (full-text search on case_number, customer_name, carrier, attorney)
- **Column visibility:** Client-side only (all columns returned, hidden via CSS/template)

### Data Flow
```
Admin/Operator Parent Component
  ├── Holds: filters signal, pagination signal, sort signal
  ├── Calls: adminService.getAllCases(params) or caseService.getOperatorAllCases(params)
  ├── Passes: cases data + total count → CaseTableComponent [input()]
  └── Receives: sort/page/filter change events ← CaseTableComponent [output()]

CaseTableComponent (shared, stateless)
  ├── Inputs: cases, totalCount, loading, visibleColumns, density, role
  ├── Outputs: sortChange, pageChange, filterChange, rowClick, rowExpand
  ├── Internal: MatTableDataSource, MatSort, MatPaginator (client-side bridge)
  └── Children: ColumnToggleComponent, DensitySelector, ExpandedRowDetail
```

### Column Group Definitions
| Group | Columns | Default Visible |
|-------|---------|-----------------|
| **Core** (locked) | Customer Name, Case Number, Status | Always |
| **Case Info** | State, Violation Type, Violation Date, Court Date | Yes |
| **Assignment** | Attorney Name, Carrier, Who Sent | Yes |
| **Contact** | Driver Phone, Customer Type | No |
| **Financial** | Attorney Price, Price CDL, Subscriber Paid, Court Fee, Court Fee Paid By | No |
| **Meta** | Next Action Date, Files (count) | No |

Default: ~10 columns visible → fits comfortably on 1280px+ screens.

### Operator vs Admin Data Scoping
| Aspect | Admin | Operator |
|--------|-------|----------|
| Cases visible | All cases in system | Own assigned + team cases (non-closed) |
| Endpoint | `GET /api/admin/cases` (extended) | `GET /api/operator/all-cases` (new) |
| Default columns | All groups visible | Core + Case Info + Assignment |
| Actions | Click → admin case detail | Click → operator case detail |
| Filters | All filters available | Status, State (no operator filter — implicit) |

## Story Dependency Graph
```
CT-1 (backend APIs) ←─── CT-2, CT-4, CT-5 depend on this
  │
  ├──▶ CT-2 (core table component — needs data shape defined)
  │       │
  │       ├──▶ CT-3 (column controls — enhances CT-2)
  │       │
  │       ├──▶ CT-4 (search/filters/expand — enhances CT-2)
  │       │
  │       └──▶ CT-6 (responsive — enhances CT-2)
  │
  └──▶ CT-5 (route integration — needs CT-2 + CT-1)

CT-7 (polish) ←─── runs after all feature stories
```

## Implementation Order (recommended)
1. **Wave 0 (backend foundation):** CT-1 — must land first, defines data contract
2. **Wave 1 (core component):** CT-2 — the shared table, can use mock data initially
3. **Wave 2 (UX enhancements):** CT-3, CT-4 (parallel — column controls + search/expand)
4. **Wave 3 (integration):** CT-5 — wire into admin + operator routes
5. **Wave 4 (polish):** CT-6, CT-7 (parallel — responsive + i18n/a11y/tests)

## Non-Functional Requirements
- **Performance:** Table must render 50 rows in <100ms; server response <200ms for sorted/
  filtered queries on 10,000+ case datasets
- **Bundle size:** CaseTableComponent + ColumnToggle < 15KB gzipped (leverage tree-shaking
  of Angular Material table already in bundle)
- **Accessibility:** WCAG 2.1 AA — sortable headers announced, column toggle keyboard
  navigable, expandable rows announced, mobile card layout screen-reader friendly
- **Browser support:** Chrome 90+, Firefox 90+, Safari 15+, Edge 90+

## Files Changed (summary — see individual stories for details)

### Backend (Modified)
- `controllers/admin.controller.js` — extend `getAllCases` with full field set, new filters,
  sorting
- `routes/admin.routes.js` — no new routes, existing `GET /api/admin/cases` enhanced
- `controllers/operator.controller.js` — new `getAllCasesTable` handler
- `routes/operator.routes.js` — new `GET /api/operator/all-cases` route
- `__tests__/admin.controller.test.js` — tests for extended getAllCases
- `__tests__/operator.controller.test.js` — tests for new getAllCasesTable

### Frontend (New)
- `features/shared/case-table/case-table.component.ts` + `.spec.ts`
- `features/shared/case-table/column-toggle.component.ts` + `.spec.ts`
- `features/shared/case-table/case-table.models.ts` — column definitions, group interfaces
- `features/shared/case-table/expanded-row-detail.component.ts` + `.spec.ts`

### Frontend (New — wrapper pages)
- `features/admin/case-table/admin-case-table.component.ts` + `.spec.ts` — new admin table page
- `features/operator/all-cases/operator-all-cases.component.ts` + `.spec.ts` — new operator table page

### Frontend (Modified)
- `features/admin/admin-routing.module.ts` — add `case-table` route (existing routes untouched)
- `features/operator/operator-routing.module.ts` — add `all-cases` route (existing routes untouched)
- `core/services/admin.service.ts` — add `getAllCasesTable` method (existing methods untouched)
- `core/services/case.service.ts` — add `getOperatorAllCases` method
- `core/layout/layout.component.ts` — add sidebar nav items for both roles
- `assets/i18n/en.json`, `es.json`, `fr.json` — ~55 new keys
