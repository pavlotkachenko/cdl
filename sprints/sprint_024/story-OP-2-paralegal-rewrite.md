# Story OP-2 — Rewrite ParalegalDashboardComponent to Angular 21

**Epic:** Angular 21 Modernization
**Sprint:** 024
**Priority:** HIGH
**Status:** DONE

## User Story

As a developer, I want the ParalegalDashboardComponent fully modernized to Angular 21 so no legacy patterns remain in the portal.

## Acceptance Criteria

- [ ] Uses Angular 21: inject(), signal(), computed(), OnPush, @if/@for, inline template/styles
- [ ] No CommonModule, no standalone:true, no Subject/takeUntil, no OnDestroy, no *ngIf/*ngFor
- [ ] No constructor injection — all deps via inject()
- [ ] Greeting computed from hour of day (signal or computed)
- [ ] 4 KPI stat cards, 4 action cards preserved from original design
- [ ] paralegal-routing.module.ts uses loadComponent (no eager import)
- [ ] External .html and .scss files deleted

## Files to Create / Modify

- `frontend/src/app/features/paralegal/dashboard/paralegal-dashboard.component.ts` — REWRITE
- `frontend/src/app/features/paralegal/dashboard/paralegal-dashboard.component.html` — DELETE
- `frontend/src/app/features/paralegal/dashboard/paralegal-dashboard.component.scss` — DELETE
- `frontend/src/app/features/paralegal/paralegal-routing.module.ts` — MODIFY (loadComponent)
