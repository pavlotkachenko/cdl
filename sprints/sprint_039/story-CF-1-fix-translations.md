# Story CF-1: Fix Translation Initialization and Language Switcher Visibility

**Status:** DONE

## Description
Sidebar navigation showed raw translation keys (NAV.DASHBOARD, NAV.MY_DRIVERS, etc.) because
TranslateService.use() was never called on app startup. The language switcher was also hidden
for non-driver roles.

## Root Cause
- `AppComponent` never called `translate.use()` — only `LanguageSwitcherComponent.ngOnInit()` did
- Layout template restricted language switcher to driver role: `@if (userRole === 'driver')`
- User menu links were hardcoded to `/driver/profile`, `/driver/settings`, etc.

## Fix
- Added `TranslateService` to `AppComponent`, calling `translate.use(saved || 'en')` in `ngOnInit`
- Removed role guard from language switcher in layout — now visible for all roles
- Made user menu links role-aware: `[routerLink]="'/' + userRole + '/profile'"`

## Files Changed
- `frontend/src/app/app.component.ts` — added TranslateService init
- `frontend/src/app/core/layout/layout.component.html` — language switcher for all roles, role-aware menu links
