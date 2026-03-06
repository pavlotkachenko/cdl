# Story I18N-1 — ngx-translate Setup + Language Switcher

**Sprint:** 034 — Spanish i18n
**Priority:** P1
**Status:** DONE

## User Story

As Miguel (driver),
I want to tap a language flag in the header and switch the entire app to Spanish,
so I can understand everything without needing English proficiency.

## Scope

### Package Installation
- `npm install @ngx-translate/core @ngx-translate/http-loader` (frontend)

### `frontend/src/app/app.config.ts` — UPDATED
- Provide `TranslateModule.forRoot()` with `HttpLoaderFactory` loading from `assets/i18n/{lang}.json`
- Default language: `'en'`; fallback language: `'en'`

### `frontend/src/assets/i18n/en.json` — CREATED
All driver-facing English strings keyed.

### `frontend/src/assets/i18n/es.json` — CREATED
Spanish translations for all keys in `en.json`.

### `frontend/src/app/shared/components/language-switcher/` — CREATED
- `language-switcher.component.ts` — two-button toggle: 🇺🇸 EN | 🇲🇽 ES
- On click: `translateService.use('es')` + `localStorage.setItem('lang', 'es')`
- On init: reads `localStorage.getItem('lang')` to restore preference

### `frontend/src/app/features/driver/driver-layout/` or nav component — UPDATED
- Embed `<app-language-switcher>` in driver header/toolbar

## Acceptance Criteria

- [x] Language switcher renders in driver header
- [x] Clicking ES switches all driver strings to Spanish instantly (no reload)
- [x] Language preference persists across page reloads (localStorage)
- [x] English remains default for new users
- [x] Non-driver routes (attorney, carrier) unaffected

## Test Coverage Matrix

| Source File | Test File | Status |
|---|---|---|
| `language-switcher.component.ts` | `language-switcher.component.spec.ts` | DONE |
