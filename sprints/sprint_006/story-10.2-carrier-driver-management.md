# Story 10.2 — Carrier Driver Management

**Epic:** Complete Carrier End-to-End Journey
**Priority:** CRITICAL
**Status:** TODO

## User Story
As Sarah (carrier),
I want to add drivers with just their name and CDL number,
see their open case count, and remove them when they leave the company,
so managing my fleet takes minutes not hours.

## Context
New component at `features/carrier/drivers/carrier-drivers.component.ts`.
Route: `/carrier/drivers` (to be registered in `carrier-routing.module.ts`).

## Backend Endpoints
- `GET /api/carriers/me/drivers` → `{ drivers: [{ id, full_name, cdl_number, openCases }] }`
- `POST /api/carriers/me/drivers` body `{ full_name, cdl_number }` → `{ driver }`
- `DELETE /api/carriers/me/drivers/:driverId` → `{ message }`

## Component Behaviour
- `ngOnInit`: loads driver list via `CarrierService.getDrivers()`
- Add-driver form: two fields only — Full Name + CDL Number (required)
- `addDriver()`: calls `CarrierService.addDriver()`, appends to list on success,
  shows success snackbar
- `removeDriver(id)`: confirms with `window.confirm`, calls
  `CarrierService.removeDriver()`, removes from list on success
- Search input filters driver list client-side by name
- Empty state shown when no drivers

## Acceptance Criteria
- [ ] Driver list displays name, CDL number, open case count
- [ ] Add driver form requires name + CDL; submits via CarrierService
- [ ] Success snackbar shown after add
- [ ] Remove driver calls service + removes from list
- [ ] Client-side search filters by name
- [ ] Empty state shown when list is empty
- [ ] Unit tests cover all paths (see Story 10.5)
