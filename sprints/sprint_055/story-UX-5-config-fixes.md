# UX-5: Fix angular.json, index.html conflicts and add dev scripts

- **Status:** DONE
- **Priority:** P1
- **Sprint:** 055

## Description

Remove conflicting prebuilt Material theme from angular.json, remove unused Roboto Google Font import from index.html, fix theme-color meta tag, and add parallel dev scripts.

## Acceptance Criteria

- [x] Removed @angular/material/prebuilt-themes/indigo-pink.css from angular.json styles array (conflicted with custom theme)
- [x] Removed Google Fonts Roboto import from index.html (app uses self-hosted Mulish)
- [x] Updated meta theme-color from #1976d2 to #1DAD8C (brand accent)
- [x] Added npm run dev script (frontend + Storybook in parallel)
- [x] Added npm run dev:all script (backend + frontend + Storybook in parallel)
- [x] ng build succeeds without prebuilt theme

## Files

- `angular.json`
- `src/index.html`
- `package.json`
