# Story AC-1 — Modernize RegisterComponent

**Epic:** Angular 21 Modernization
**Sprint:** 025
**Priority:** HIGH
**Status:** TODO

## Acceptance Criteria

- [ ] No standalone:true, CommonModule, RouterModule, constructor injection, *ngIf
- [ ] inject() for all deps; signal() for loading/error/hide states
- [ ] computed() for passwordStrength, passwordStrengthLabel, passwordStrengthColor
- [ ] takeUntilDestroyed() for password valueChanges subscription
- [ ] Inline template (@if instead of *ngIf) + inline styles; delete .html and .scss
- [ ] RouterLink imported directly (not RouterModule)
- [ ] OnPush change detection

## Files

- `frontend/src/app/features/auth/register/register.component.ts` — REWRITE
- `frontend/src/app/features/auth/register/register.component.html` — DELETE
- `frontend/src/app/features/auth/register/register.component.scss` — DELETE
