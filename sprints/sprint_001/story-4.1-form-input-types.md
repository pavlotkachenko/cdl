# Story 4.1 — Fix Form Input Types & Autocomplete

**Epic:** Mobile Polish
**Priority:** HIGH
**Status:** DONE

## User Story
As a driver using my phone,
I want the correct keyboard type to appear for each field,
so that filling forms is fast and doesn't require keyboard switching.

## Scope
Audit and fix all forms in driver and carrier flows:

| Field Type | type= | inputmode= | autocomplete= |
|---|---|---|---|
| Email | email | email | email |
| Phone | tel | tel | tel |
| CDL/DOT number | text | numeric | off |
| Password (login) | password | — | current-password |
| Password (signup) | password | — | new-password |

Files to fix:
- `register.component.html`
- Carrier signup wizard form
- `login.component.html`
- `forgot-password.component.html`
- `profile.component.html`

## Acceptance Criteria
- [ ] Numeric keyboard on phone/CDL/DOT fields (iOS Safari + Chrome Android)
- [ ] Email keyboard on email fields
- [ ] Password managers can autofill login credentials
- [ ] No horizontal scroll on any form at 375px viewport
