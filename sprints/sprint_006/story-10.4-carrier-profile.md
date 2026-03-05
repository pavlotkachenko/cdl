# Story 10.4 — Carrier Profile & Settings

**Epic:** Complete Carrier End-to-End Journey
**Priority:** MEDIUM
**Status:** TODO

## User Story
As Sarah (carrier),
I want to update my company profile (name, DOT number, contact email)
and toggle email alerts for when a driver receives a new ticket,
so our records stay accurate and I'm never surprised by violations.

## Context
New component at `features/carrier/profile/carrier-profile.component.ts`.
Route: `/carrier/profile` (to be registered in `carrier-routing.module.ts`).

## Backend Endpoints
- `GET /api/carriers/me` → `{ carrier: { company_name, usdot_number, email, phone_number, notify_on_new_ticket } }`
- `PUT /api/carriers/me` body `{ company_name, phone_number, notify_on_new_ticket }` → `{ carrier }`

## Component Behaviour
- `ngOnInit`: loads profile via `CarrierService.getProfile()`, patches reactive form
- Form fields: Company Name (required), USDOT Number (read-only), Contact Email (read-only),
  Phone Number, Notify on New Ticket (slide toggle)
- `save()`: calls `CarrierService.updateProfile()`, shows success snackbar on success,
  error snackbar on failure
- `goBack()`: navigates to `/carrier/dashboard`

## Acceptance Criteria
- [ ] Profile loaded and form patched on init
- [ ] USDOT and email are read-only (display only)
- [ ] Save calls `CarrierService.updateProfile()` with form values
- [ ] Success snackbar shown after save
- [ ] Error snackbar shown on failure
- [ ] `goBack()` navigates to dashboard
- [ ] Unit tests cover all paths (see Story 10.5)
