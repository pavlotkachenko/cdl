# Story AP-1: Fix i18n — Add Missing ATT Keys to es.json and fr.json

**Status:** DONE

## Description
Added ~90 missing ATT translation keys to both `es.json` (Spanish) and `fr.json` (French). These keys are referenced by Attorney page templates but were absent from the translation files, causing raw `ATT.*` keys to display when switching languages.

## Acceptance Criteria
- [x] Every ATT key in en.json also exists in es.json with Spanish translation
- [x] Every ATT key in en.json also exists in fr.json with French translation
- [x] JSON files are valid (no syntax errors)
- [x] Build passes

## Files Changed
- `frontend/src/assets/i18n/es.json` — added ~90 missing ATT keys with Spanish translations (dashboard, cases, calendar, clients, reports, documents, profile keys)
- `frontend/src/assets/i18n/fr.json` — added ~90 missing ATT keys with French translations (same set)
