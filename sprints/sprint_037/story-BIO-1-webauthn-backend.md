# Story BIO-1 — WebAuthn Backend

**Sprint:** 037
**Priority:** P2
**Status:** DONE

## Scope
- Install: @simplewebauthn/server
- `backend/src/migrations/016_webauthn_credentials.sql` — NEW table
- `backend/src/services/webauthn.service.js` — NEW
- `backend/src/controllers/webauthn.controller.js` — NEW: 4 endpoints
- `backend/src/routes/webauthn.routes.js` — NEW, mounted at /api/auth/webauthn
- `backend/src/server.js` — mount route

## Endpoints
- POST /register/options
- POST /register/verify
- POST /auth/options
- POST /auth/verify (returns JWT on success)
