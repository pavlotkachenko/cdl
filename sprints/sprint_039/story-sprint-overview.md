# Sprint 039 — Carrier Portal: Sidebar Fix, Mock Data, Missing Pages

## Goal
Fix sidebar translations for all roles, add mock data fallbacks to all carrier API calls,
and create the missing carrier portal pages (payments, notifications, settings, documents).

## Stories

| # | ID | Title | Status |
|---|-----|-------|--------|
| 1 | CF-1 | Fix translation initialization and language switcher visibility | DONE |
| 2 | CM-1 | Carrier service mock data fallbacks | DONE |
| 3 | CP-1 | Carrier payments page | DONE |
| 4 | CN-1 | Carrier notifications page | DONE |
| 5 | CS-1 | Carrier settings page | DONE |
| 6 | CD-1 | Carrier documents page | DONE |

## Scope
- Fixed: TranslateService.use() now called on app init (AppComponent)
- Fixed: Language switcher shown for all roles (not just driver)
- Fixed: User menu links are role-aware (not hardcoded to /driver/)
- CarrierService: all API methods fall back to mock data on error
- 4 new carrier pages with full UI: payments, notifications, settings, documents
- Carrier routing updated with 4 new lazy-loaded routes
