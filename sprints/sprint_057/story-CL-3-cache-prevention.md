# Story CL-3: Cache Prevention — Auto-Clean Angular Cache

**Status:** DONE
**Priority:** P1
**Sprint:** 057

## Description
Prevent stale Vite/Angular cache from causing 504 errors during development by automatically cleaning the cache before `ng serve` and `ng build`.

## Root Cause
Running `ng build` while `ng serve` was active corrupted the shared `.angular/cache/` directory. The stale dependency optimization cache caused `504 Outdated Optimize Dep` errors when loading lazy-loaded route chunks, making post-login navigation fail silently.

## Changes
- `frontend/package.json`: Added `prestart` script (`ng cache clean`) — runs before `npm start`
- `frontend/package.json`: Added `prebuild` script (`ng cache clean`) — runs before `npm run build`
- `frontend/package.json`: Added `clean` script (`ng cache clean && rm -rf dist`) — manual full clean

## Why Tests Didn't Catch This
Unit tests and component tests use a separate Vite transform pipeline with fresh cache. E2E tests in CI start with a clean environment. Only local dev servers with accumulated cache can hit this issue.

## Acceptance Criteria
- [x] `npm start` clears cache before serving
- [x] `npm run build` clears cache before building
- [x] `npm run clean` available for manual cache + dist cleanup
- [x] `.angular/cache` already in `.gitignore`
