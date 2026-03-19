# Sprint 065 — Case Detail Redesign

## Theme

Full redesign of the Driver "Single Case" view (`case-detail.component`) to match the new design system, migrate to Angular 21 conventions, fix data layer gaps (status history, messaging, activity log), consolidate routes, and implement missing features (edit mode, share case).

## Stories

| ID | Title | Priority | Batch | Status |
|----|-------|----------|-------|--------|
| CD-1 | Backend — Enrich case endpoint with status history | P0 | 1 | DONE |
| CD-2 | Backend — Driver-accessible case messaging endpoints | P0 | 1 | DONE |
| CD-3 | Frontend — Route consolidation (deprecate `/driver/tickets/:id`) | P0 | 1 | DONE |
| CD-4 | Frontend — Case Detail Component Redesign (core) | P0 | 2 | DONE |
| CD-5 | Frontend — Messaging & Activity Log Integration | P1 | 3 | DONE |
| CD-6 | Frontend — Edit Mode Implementation | P1 | 3 | DONE |
| CD-7 | Frontend — Share Case Feature | P2 | 3 | DONE |

## Batch Dependencies

```
Batch 1 (parallel):  CD-1, CD-2, CD-3
Batch 2 (depends on 1): CD-4
Batch 3 (depends on 2): CD-5, CD-6, CD-7
```

## Definition of Done

- All acceptance criteria checked
- All tests pass: `cd frontend && npx ng test --no-watch` and `cd backend && npm test`
- No `mat-icon` in case-detail component — only emoji + inline SVG
- Angular 21 conventions: signals, inject(), OnPush, native control flow
- WCAG 2.1 AA: ARIA labels, keyboard navigable, 44px touch targets
- Mobile-first responsive layout
