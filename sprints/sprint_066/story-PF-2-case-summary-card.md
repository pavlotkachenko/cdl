# Story: PF-2 — Frontend — Enriched Case Summary Card

**Sprint:** sprint_066
**Priority:** P0
**Status:** DONE

## User Story

As Miguel (Driver),
I want to see a rich summary of my case (case number, violation badge, attorney info, status, court date) on the payment page,
So that I can verify I'm paying for the right case before entering my card.

## Scope

### Files to Modify
- `frontend/src/app/features/driver/case-payment/case-payment.component.html`
- `frontend/src/app/features/driver/case-payment/case-payment.component.scss`
- `frontend/src/app/features/driver/case-payment/case-payment.component.ts`

### Implementation

Replace the current simple Case Summary card with a richer version matching the HTML template:

#### Card Structure
```
pay-card > pay-card-header (icon + title + subtitle) > case-info-grid
```

#### Rows
1. **Case** — label with document SVG icon, value as teal link (`case-id-link`) showing case number + chevron
2. **Violation** — label with star SVG icon, value as red badge with car emoji + violation type, plus muted location text
3. **Attorney** — label with person SVG icon, value as mini avatar (28px, initials, blue gradient) + name + muted "CDL Defense · N yrs"
4. **Status** — label with activity SVG icon, value as status badge (amber "In Progress" pill with dot) + muted "Court: Apr 14, 2026"

#### New Signals/Computed
- `attorneyInitials = computed(() => ...)` — derive from attorney name (first letter of each word)
- `caseStatus = signal('')` — from case data (map to display label)
- Parse `violation_location` or `court_location` for the location display

#### Case ID Link
Clicking the case number navigates to `/driver/cases/:caseId` (existing `goBack()` route).

## Acceptance Criteria

- [ ] Case summary card has header with document icon, "Case Summary" title, "Review the details..." subtitle
- [ ] Case row shows case number as teal link with chevron — clicking navigates to case detail
- [ ] Violation row shows red badge with emoji + violation type, plus location in muted text
- [ ] Attorney row shows 28px avatar circle with initials (blue gradient), name, and experience years
- [ ] Status row shows status badge pill (amber for in_progress, green for resolved, etc.) + court date
- [ ] Each row has an inline SVG icon before the label
- [ ] All data is populated from existing signals (caseNumber, violationType, courtLocation, attorney, courtDate)
- [ ] Empty/null fields gracefully hidden with `@if`

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `case-payment.component.ts` | `case-payment.component.spec.ts` | defer to PF-7 |

## Dependencies

- Depends on: PF-1 (layout structure)
- Blocked by: none

## Notes

- The status badge styling should use the same pattern as case-detail: `.status-badge` with color variants.
- Attorney initials: `"James Wilson" → "JW"`, `"Sarah" → "S"`.
- Violation type display: capitalize and prepend car emoji (e.g., `speeding` → `🚗 Speeding`).
