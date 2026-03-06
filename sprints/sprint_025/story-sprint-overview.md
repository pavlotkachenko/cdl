# Sprint 025 — Auth Components Modernization

**Epic:** Angular 21 Modernization
**Sprint:** 025
**Priority:** HIGH
**Status:** IN PROGRESS

## Goal

Modernize the three auth components (register, forgot-password, reset-password) to Angular 21 patterns and add spec coverage. These are the entry point for all new users and are the last un-tested auth screens.

## Stories

| Story | Title | Priority | Status |
|---|---|---|---|
| [AC-1](story-AC-1-register.md) | Modernize RegisterComponent | HIGH | TODO |
| [AC-2](story-AC-2-forgot-reset.md) | Modernize ForgotPasswordComponent + ResetPasswordComponent | HIGH | TODO |
| [AC-3](story-AC-3-specs.md) | Specs for all 3 auth components | HIGH | TODO |

## Definition of Done (Sprint)

- [ ] All 3 stories completed
- [ ] No legacy patterns (standalone:true, CommonModule, RouterModule, constructor injection, *ngIf) in touched files
- [ ] Signals for all mutable state; computed() for derived state (passwordStrength)
- [ ] All tests pass: `npx ng test --no-watch` + `cd backend && npm test`
- [ ] Sprint folder complete, all story statuses updated to DONE
