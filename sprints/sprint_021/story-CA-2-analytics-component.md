# Story CA-2 — Frontend: CarrierAnalyticsComponent

**Epic:** Carrier Fleet Analytics
**Sprint:** 021
**Priority:** HIGH
**Status:** DONE

## User Story

As Sarah,
I want an Analytics page showing my fleet's trends, violation types, and at-risk drivers,
so I can report fleet health to management at a glance.

## Acceptance Criteria

- [ ] New page at `/carrier/analytics` lazy-loaded from `carrier-routing.module.ts`
- [ ] KPI row: Success Rate, Avg Resolution, Total Cases, Estimated Savings (4 cards)
- [ ] Monthly trend: CSS bar chart (last 6 months, no Chart.js)
- [ ] Violation breakdown: horizontal bar list with type label + percentage
- [ ] At-risk drivers table: name, open cases, green/yellow/red risk badge
- [ ] Loading skeleton while fetching
- [ ] Error state with retry
- [ ] "Export CSV" button triggers download (CA-3)
- [ ] "← Back to Dashboard" navigation link

## Files to Create / Modify

- `frontend/src/app/features/carrier/analytics/carrier-analytics.component.ts` — NEW
- `frontend/src/app/features/carrier/carrier-routing.module.ts` — add `/analytics` route
- `frontend/src/app/core/services/carrier.service.ts` — add `getAnalytics()`, `exportCsv()`

## CarrierService additions

```typescript
export interface FleetAnalytics {
  casesByMonth: { month: string; count: number }[];
  violationBreakdown: { type: string; count: number; pct: number }[];
  successRate: number;
  avgResolutionDays: number;
  atRiskDrivers: { id: string; name: string; openCases: number; riskLevel: 'green' | 'yellow' | 'red' }[];
  estimatedSavings: number;
}

getAnalytics(): Observable<FleetAnalytics>
exportCsv(): Observable<Blob>
```

## Key Implementation Notes

- Angular 21: `inject()`, `signal()`, `computed()`, OnPush, `@if`/`@for`
- CSS bar chart: `height: Npx` driven by `count / maxCount * 100`% — no external lib
- `CurrencyPipe` + `PercentPipe` from `@angular/common` for KPI formatting
- Mobile-first: KPI grid 2×2 on small, 4×1 on desktop
