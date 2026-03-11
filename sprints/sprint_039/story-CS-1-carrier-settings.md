# Story CS-1: Carrier Settings Page

**Status:** DONE

## Description
New settings page for the carrier portal with company information form, notification
preferences (toggle switches), and security actions.

## Acceptance Criteria
- [x] Company info form (name, USDOT, email, phone) with save functionality
- [x] Notification preferences with slide toggles (new tickets, case status, payments, weekly digest)
- [x] Security section with change password, biometric login, session management buttons
- [x] Loads current profile data from CarrierService
- [x] Signals + OnPush + standalone component + reactive forms
- [x] Route: `/carrier/settings` (lazy-loaded)

## Files Changed
- `frontend/src/app/features/carrier/settings/carrier-settings.component.ts` — new component
- `frontend/src/app/features/carrier/carrier-routing.module.ts` — added settings route
