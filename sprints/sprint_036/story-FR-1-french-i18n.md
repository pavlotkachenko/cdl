# Story FR-1 — French Language Support

**Sprint:** 036
**Priority:** P1
**Status:** DONE

## Scope
- `frontend/src/assets/i18n/fr.json` — NEW: full French translations
- `frontend/src/app/shared/components/language-switcher/language-switcher.component.ts` — add 'fr' + 🇫🇷 FR button
- Update en.json + es.json to add "FR": "Français" to LANG section

## Acceptance Criteria
- [x] All driver-facing strings render in French when FR selected
- [x] Language persisted to localStorage as 'fr'
- [x] FR button visible in toggle group
