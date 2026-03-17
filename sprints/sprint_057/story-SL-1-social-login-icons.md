# Story SL-1: Social Login — Brand Icons & MatIconRegistry

**Status:** DONE
**Priority:** P0
**Sprint:** 057

## Description
Download official Google and Facebook brand SVG icons and register them with Angular Material's MatIconRegistry for use in social login buttons.

## Files Created
- `frontend/src/assets/icons/google.svg` — Multicolor Google "G" logo (official brand colors)
- `frontend/src/assets/icons/facebook-brand.svg` — Facebook "f" logo (#1877F2)

## Files Modified
- `frontend/src/app/app.component.ts` — Added MatIconRegistry + DomSanitizer imports, registered both icons in constructor

## Usage
```html
<mat-icon svgIcon="google"></mat-icon>
<mat-icon svgIcon="facebook"></mat-icon>
```

## Acceptance Criteria
- [x] Google SVG uses official brand colors (#4285F4, #34A853, #FBBC05, #EA4335)
- [x] Facebook SVG uses official brand color (#1877F2)
- [x] Both icons registered in AppComponent constructor
- [x] Icons render correctly via `<mat-icon svgIcon="...">`
- [x] Build passes with new imports
