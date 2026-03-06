# Story OP-1 — Fix OperatorDashboardComponent: OnDestroy → DestroyRef

**Epic:** Angular 21 Modernization
**Sprint:** 024
**Priority:** HIGH
**Status:** DONE

## User Story

As a developer, I want the OperatorDashboardComponent to use DestroyRef instead of OnDestroy so it follows Angular 21 patterns consistently.

## Acceptance Criteria

- [ ] Remove `implements OnInit, OnDestroy` — keep ngOnInit, replace ngOnDestroy with DestroyRef
- [ ] `inject(DestroyRef).onDestroy(() => clearInterval(refreshInterval))` pattern
- [ ] No `OnDestroy` import, no `ngOnDestroy()` method
- [ ] Spec updated: remove `component.ngOnDestroy()` call in afterEach

## Files to Create / Modify

- `frontend/src/app/features/operator/operator-dashboard/operator-dashboard.component.ts` — MODIFY
- `frontend/src/app/features/operator/operator-dashboard/operator-dashboard.component.spec.ts` — MODIFY
