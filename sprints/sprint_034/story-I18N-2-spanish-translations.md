# Story I18N-2 — Driver-Facing Spanish Translations

**Sprint:** 034 — Spanish i18n
**Priority:** P1
**Status:** DONE

## User Story

As Miguel (driver),
I want all driver-facing labels, buttons, and status messages in Spanish,
so I never have to guess what an English word means.

## Scope

Driver components updated to use `translate` pipe instead of hardcoded English:

### Components to update with `| translate` pipe:

| Component | Key strings to translate |
|---|---|
| `submit-ticket.component` | Step labels, button text, field labels, OCR status messages |
| `case-list.component` | Status labels, empty state, filter labels |
| `case-detail.component` | Status stages, action buttons, date labels |
| `case-payment.component` | Plan names, amounts, button text, success messages |
| `attorney-selection.component` | Card labels, "Recommended", "Choose", win rate |
| `messaging.component` | Input placeholder, send button |
| `notifications.component` | Notification messages |
| `driver-dashboard.component` | Metric labels, section titles |

### `frontend/src/assets/i18n/en.json` — CREATED (full driver string set)
```json
{
  "SUBMIT_TICKET": { "TITLE": "Submit Ticket", "STEP_PHOTO": "Take Photo", ... },
  "CASE_STATUS": { "SUBMITTED": "Submitted", "IN_PROGRESS": "In Progress", ... },
  "PAYMENT": { "PAY_NOW": "Pay Now", "MOST_POPULAR": "Most Popular", ... },
  ...
}
```

### `frontend/src/assets/i18n/es.json` — CREATED (full Spanish translations)
```json
{
  "SUBMIT_TICKET": { "TITLE": "Enviar Multa", "STEP_PHOTO": "Tomar Foto", ... },
  "CASE_STATUS": { "SUBMITTED": "Enviado", "IN_PROGRESS": "En Proceso", ... },
  "PAYMENT": { "PAY_NOW": "Pagar Ahora", "MOST_POPULAR": "Más Popular", ... },
  ...
}
```

## Acceptance Criteria

- [x] All visible driver strings use translation keys (no hardcoded English in templates)
- [x] Full Spanish translation coverage for all driver routes
- [x] Status labels translated (Submitted, In Progress, Resolved, etc.)
- [x] Error messages translated
- [x] Attorney and carrier components NOT modified (English only per roadmap scope)

## Test Coverage Matrix

| Source File | Test File | Status |
|---|---|---|
| `en.json` + `es.json` | key-coverage script / spec | DONE |
