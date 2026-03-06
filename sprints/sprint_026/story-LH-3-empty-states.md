# Story LH-3 — Empty States on Remaining Dashboards

**Sprint:** 026 — Launch Hardening
**Status:** DONE

## Scope

Replace plain "No X found." text with icon + heading + helper text + CTA empty states on the remaining dashboards that were not upgraded in Sprint 012.

## Changes

### Admin Dashboard — UPDATED
- Replaced `<p>No cases found.</p>` with full empty-state component pattern:
  - Icon (mat-icon)
  - Heading: "No cases yet"
  - Helper text: "New cases will appear here once drivers submit tickets."
  - CTA: none (admin is read-only view)

### Carrier Analytics Component — UPDATED
- Added zero-data full-page empty state when `totalCases === 0`:
  - Icon + heading + helper text: "No ticket data yet. Add drivers and cases to see analytics."
- Chart sections upgraded from plain `<p>No data</p>` to icon + message pattern (consistent with other empty states)

## Components Modified

- `frontend/src/app/features/admin/admin-dashboard/admin-dashboard.component.html`
- `frontend/src/app/features/carrier/carrier-analytics/carrier-analytics.component.html`
- `frontend/src/app/features/carrier/carrier-analytics/carrier-analytics.component.ts`

## Test Coverage Matrix

| Source File | Test File | Status |
|---|---|---|
| `carrier-analytics.component.ts` | `carrier-analytics.component.spec.ts` | ✅ (LH-4 expanded) |
| `admin-dashboard.component.ts` | `admin-dashboard.component.spec.ts` | ✅ pre-existing |
