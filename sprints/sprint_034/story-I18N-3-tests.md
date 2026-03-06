# Story I18N-3 — Tests

**Sprint:** 034 — Spanish i18n
**Priority:** P1
**Status:** DONE

## Frontend Tests

### `language-switcher.component.spec.ts` — CREATED (~4 tests)
- Component creates without errors
- Clicking ES button calls `translateService.use('es')`
- Language preference stored in localStorage on switch
- Preference restored from localStorage on init

### `i18n-coverage.spec.ts` — CREATED (key coverage check)
- Every key in `en.json` exists in `es.json` (no missing translations)
- No empty string values in `es.json`

### Updated component specs (+1 test each for 5 key components)
- `submit-ticket.component.spec.ts` — English strings not hardcoded in template (uses translate pipe)
- `case-list.component.spec.ts` — status labels translated when lang = 'es'
- `case-payment.component.spec.ts` — "Pay Now" becomes "Pagar Ahora" in ES mode
- `attorney-selection.component.spec.ts` — "Recommended" badge text translated

## Totals (estimated)

- Frontend: ~12 new tests
