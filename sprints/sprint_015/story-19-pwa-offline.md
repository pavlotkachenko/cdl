# Story 19 — PWA Offline Support

**Sprint:** 015 — PWA Offline Support
**Status:** DONE

## Scope

Service worker registration, web app manifest, API caching strategy, offline page.

## Changes

### 19.1 `ngsw-config.json` — UPDATED
- Renamed app asset group to `app-shell`, added `manifest.webmanifest` to prefetch list
- Split data groups into `api-freshness` (notifications + case status, 5m, 3s timeout) and `api-performance` (cases/carriers/users, 10m, 10s timeout)
- Added `navigationUrls` pattern so the SW handles all navigation (SPA routing)

### 19.2 `src/manifest.webmanifest` — NEW
- `name`: "CDL Ticket Management", `short_name`: "CDL Tickets"
- `theme_color`: #1976d2, `background_color`: #ffffff
- `display: standalone`, `start_url: /`
- Icon entries for 48px (favicon.ico), 192px and 512px PNG (paths for future icon assets)

### 19.3 `app.config.ts` — UPDATED
- Added `provideServiceWorker('ngsw-worker.js', { enabled: !isDevMode(), registrationStrategy: 'registerWhenStable:30000' })`
- SW only registers in production builds (disabled in dev/test)

### 19.4 `src/app/core/services/pwa.service.ts` — NEW
- `online = signal(navigator.onLine)` — reflects live connectivity
- `updateAvailable = signal(false)` — set to `true` when `VERSION_READY` fires
- Subscribes to `window` online/offline events
- `activateUpdate()` — delegates to `SwUpdate.activateUpdate()` when enabled, returns `false` when disabled

### 19.5 `src/app/features/offline/offline.component.ts` — NEW
- Inline template: wifi_off icon, "You're offline" heading, paragraph, "Try Again" button
- `reload()` calls `window.location.reload()`
- OnPush, no external dependencies beyond Material

### 19.6 `app-routing.module.ts` — UPDATED
- Added `{ path: 'offline', loadComponent: () => import('./features/offline/offline.component') }`

## Spec Files

### NEW: `pwa.service.spec.ts` (6 tests)
- online signal defaults to true
- updateAvailable defaults to false
- updateAvailable becomes true when VERSION_READY fires
- activateUpdate calls swUpdate.activateUpdate when enabled
- activateUpdate returns false when service worker is disabled
- does not subscribe to versionUpdates when SW is disabled

### NEW: `offline.component.spec.ts` (4 tests)
- renders the offline heading
- renders the wifi_off icon
- renders the Try Again button
- component exposes a reload method

## Offline Behaviour Summary

| Scenario | Behaviour |
|---|---|
| First visit (online) | SW installs, caches app shell + assets |
| Navigation while offline | SW serves cached index.html (SPA shell) |
| API call while offline (freshness) | Returns cached response if within 5m; network error otherwise |
| API call while offline (performance) | Returns cached response if within 10m |
| New SW version deployed | `updateAvailable` signal becomes `true`; UI can prompt user to reload |
| User navigates to `/offline` | `OfflineComponent` rendered with Try Again button |

## Total
372/372 tests pass (was 362 before Sprint 015, +10 new tests).
