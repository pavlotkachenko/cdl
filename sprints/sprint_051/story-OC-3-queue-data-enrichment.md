# Story OC-3: Queue Data Enrichment (Court Date, Fine Amount, Priority)

## Status: DONE

## Priority: P0

## Depends On: None (foundational)

## Description
The current operator dashboard queue shows basic case data (case number, customer name, violation
type, state, status, age). TC-OPR-001 requires each card to also show **court date**, **fine
amount**, and **priority color-coding**. This story enriches the backend response and updates
the dashboard component's template to display the additional fields.

### User Story
> As an **operator**, I want each case in my queue to show the court date, fine amount, and a
> priority color indicator so I can quickly triage which cases need immediate attention.

## Backend Changes

### Modify: `GET /api/operator/cases` (getOperatorCases)
In `operator.controller.js`:
- Join `court_dates` table: for each case, fetch the **next upcoming** court date (closest
  future date, or most recent if all past)
  ```sql
  LEFT JOIN court_dates ON court_dates.case_id = cases.id
  ```
  Since Supabase JS client doesn't support lateral joins directly, use a separate query or
  embed with PostgREST foreign key:
  ```javascript
  .select(`
    ...,
    court_dates(id, date, time, courthouse)
  `)
  ```
  Then pick the next upcoming date in JS.
- Include `fine_amount` from the `cases` table (already present in schema, just not selected)
- Add `priority` computed field based on business rules:
  - `critical`: court date within 3 days OR case age >96 hours with no attorney
  - `high`: court date within 7 days OR case age >48 hours
  - `medium`: court date within 14 days OR case age >24 hours
  - `low`: everything else

**Updated response shape per case:**
```json
{
  "id": "...", "case_number": "CDL-601", "status": "reviewed",
  "violation_type": "Speeding", "state": "TX",
  "customer_name": "Marcus Rivera",
  "fine_amount": 350,
  "court_date": "2026-04-10T09:00:00Z",
  "courthouse": "Harris County Court",
  "priority": "high",
  "ageHours": 72,
  "created_at": "..."
}
```

### Modify: `GET /api/operator/unassigned` (getUnassignedCases)
Same enrichment: add `fine_amount`, `court_date`, `courthouse`, and `priority` to each
unassigned case.

### Priority Calculation Utility
Extract priority logic into a reusable function in `operator.controller.js` or a shared util:
```javascript
function calculatePriority(caseData, courtDate) {
  const now = Date.now();
  const ageHours = (now - new Date(caseData.created_at).getTime()) / (1000 * 60 * 60);
  const daysUntilCourt = courtDate
    ? (new Date(courtDate).getTime() - now) / (1000 * 60 * 60 * 24)
    : Infinity;
  const hasAttorney = !!caseData.assigned_attorney_id;

  if (daysUntilCourt <= 3 || (ageHours > 96 && !hasAttorney)) return 'critical';
  if (daysUntilCourt <= 7 || ageHours > 48) return 'high';
  if (daysUntilCourt <= 14 || ageHours > 24) return 'medium';
  return 'low';
}
```

## Frontend Changes

### Dashboard Component Updates
In `operator-dashboard.component.ts`:

**Data model update** — extend the case interface used by `myCases()` and `unassignedCases()`:
```typescript
interface OperatorCase {
  // existing fields...
  fine_amount: number | null;
  court_date: string | null;
  courthouse: string | null;
  priority: 'critical' | 'high' | 'medium' | 'low';
}
```

**My Assigned Cases table** — add columns:
- Court date (formatted as "Apr 10, 2026" or "—" if none)
- Fine amount (formatted as "$350" or "—")
- Priority indicator (colored dot or left-border bar matching priority level)

**Unassigned Queue cards** — the cards already have a color bar; bind it to `priority`:
- `critical` → red (#E53935)
- `high` → orange (#FB8C00)
- `medium` → amber (#FDD835)
- `low` → green (#43A047)

Add fine amount and court date to card body.

**Priority legend** — small inline legend at the top of each section explaining the color codes.
Use `matTooltip` on the colored dots for screen reader users.

### Sorting
Default sort for unassigned queue: `critical` first, then `high`, then by `ageHours` descending
within each priority level. Add a `sortedUnassigned` computed signal.

## Acceptance Criteria
- [ ] `GET /api/operator/cases` returns `fine_amount`, `court_date`, `courthouse`, `priority` per case
- [ ] `GET /api/operator/unassigned` returns the same enriched fields
- [ ] Priority is calculated correctly based on court date proximity and case age
- [ ] Dashboard table shows court date and fine amount columns
- [ ] Unassigned queue cards show court date, fine amount, and priority color bar
- [ ] Priority color coding: red (critical), orange (high), amber (medium), green (low)
- [ ] Unassigned queue is sorted by priority then age
- [ ] Cases with no court date show "—" (not empty or null)
- [ ] Fine amount shows "$0" for zero, "—" for null
- [ ] All new text uses TranslateModule with `OPR.*` keys
- [ ] Existing dashboard tests still pass (backward-compatible data shape)
- [ ] Build succeeds with no errors

## Test Coverage

### Backend Tests
- `getOperatorCases` includes `fine_amount`, `court_date`, `priority` in response
- `getUnassignedCases` includes enriched fields
- Priority calculation: court date in 2 days → `critical`
- Priority calculation: case age 50h, no court date → `high`
- Priority calculation: court date in 10 days, case age 20h → `medium`
- Priority calculation: court date in 30 days, case age 5h → `low`
- Priority calculation: no attorney + age >96h → `critical` regardless of court date

### Frontend Tests
- Dashboard renders court date column with formatted date
- Dashboard renders fine amount column with currency formatting
- Priority color bar matches priority value
- Unassigned queue sorted by priority then age
- Null court date displays "—"
- Null fine amount displays "—"
- Existing 21 dashboard tests continue to pass
