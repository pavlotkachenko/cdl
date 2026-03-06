# Story AC-2 — Modernize ForgotPasswordComponent + ResetPasswordComponent

**Epic:** Angular 21 Modernization
**Sprint:** 025
**Priority:** HIGH
**Status:** TODO

## Acceptance Criteria

- [ ] Both: no standalone:true, CommonModule, RouterModule, constructor injection, *ngIf
- [ ] inject() for all deps; signal() for all mutable state
- [ ] ForgotPassword: emailSent, loading, errorMessage, successMessage as signals
- [ ] ResetPassword: loading, errorMessage, successMessage, hidePassword, tokenError as signals
- [ ] Inline template + inline styles; delete .html and .scss for both
- [ ] RouterLink imported directly

## Files

- `frontend/src/app/features/auth/forgot-password/forgot-password.component.ts` — REWRITE
- `frontend/src/app/features/auth/forgot-password/forgot-password.component.html` — DELETE
- `frontend/src/app/features/auth/forgot-password/forgot-password.component.scss` — DELETE
- `frontend/src/app/features/auth/reset-password/reset-password.component.ts` — REWRITE
- `frontend/src/app/features/auth/reset-password/reset-password.component.html` — DELETE
- `frontend/src/app/features/auth/reset-password/reset-password.component.scss` — DELETE
