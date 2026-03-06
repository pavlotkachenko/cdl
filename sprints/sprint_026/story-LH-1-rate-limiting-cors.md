# Story LH-1 — Rate Limiting + CORS Hardening

**Sprint:** 026 — Launch Hardening
**Status:** DONE

## Scope

Harden backend security before beta by adding rate limiting to sensitive endpoints and locking CORS to explicit origins.

## Changes

### `backend/src/app.js` — UPDATED
- Installed `express-rate-limit`
- Auth routes `/api/auth/*`: 100 requests / 15-minute window
- Public submit `/api/cases/public-submit`: 10 requests / 15-minute window
- CORS: `PRODUCTION_URL` env var support; dynamic origin callback — no wildcard (`*`) in any environment

### `backend/src/__tests__/server.ratelimit.test.js` — CREATED
- 11 tests covering rate limit enforcement on auth and public-submit endpoints

## Test Coverage Matrix

| Source File | Test File | Status |
|---|---|---|
| `backend/src/app.js` (rate limiting + CORS) | `backend/src/__tests__/server.ratelimit.test.js` | ✅ |
