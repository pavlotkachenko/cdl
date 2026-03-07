# Story BIO-2 — WebAuthn Frontend

**Sprint:** 037
**Priority:** P2
**Status:** DONE

## Scope
- Install: @simplewebauthn/browser
- `frontend/src/app/features/auth/login/login.component.ts` — add biometric button
- `frontend/src/app/features/driver/settings/biometric/biometric-setup.component.ts` — NEW

## Acceptance Criteria
- [x] Biometric button shown on login only if webauthn_enrolled=true in localStorage
- [x] Successful enrollment sets webauthn_enrolled=true
- [x] Authentication via WebAuthn returns same JWT and navigates to dashboard
