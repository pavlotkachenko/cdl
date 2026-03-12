# Story AP-5: Remove Subscription from Attorney Sidebar

**Status:** DONE

## Description
Removed the `NAV.SUBSCRIPTION` navigation item from the attorney sidebar navigation array. Subscription is now only available for Driver and Carrier roles.

## Files Changed
- `frontend/src/app/core/layout/sidebar/sidebar.component.ts` — removed `{ name: 'NAV.SUBSCRIPTION', icon: 'credit_card', link: '/attorney/subscription' }` from `attorneyNavigation` array
