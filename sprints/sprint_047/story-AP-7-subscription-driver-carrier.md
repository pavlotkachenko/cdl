# Story AP-7: Move Subscription to Driver and Carrier

**Status:** DONE

## Description
Extended the subscription management page (previously Attorney-only) to Driver and Carrier roles:
- Added `/driver/subscription` route in `driver-routing.module.ts` pointing to the shared `SubscriptionManagementComponent`
- Added `/carrier/subscription` route in `carrier-routing.module.ts` pointing to the shared `SubscriptionManagementComponent`
- Added "Subscription" navigation item to both Driver and Carrier sidebar navigation arrays

## Files Changed
- `frontend/src/app/features/driver/driver-routing.module.ts` — added subscription route
- `frontend/src/app/features/carrier/carrier-routing.module.ts` — added subscription route
- `frontend/src/app/core/layout/sidebar/sidebar.component.ts` — added Subscription nav item to driverNavigation and carrierNavigation arrays
