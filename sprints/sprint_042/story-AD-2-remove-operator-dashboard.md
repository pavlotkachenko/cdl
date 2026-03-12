# Story AD-2: Remove Operator Dashboard Sidebar & Route

**Status:** DONE

## Description
Removed the separate "Admin Dashboard" (operator-dashboard) sidebar navigation item and its route, since its content is now merged into the main Dashboard.

## Changes
- Removed `NAV.OPERATOR_DASHBOARD` item from adminNavigation array in sidebar
- Removed `operator-dashboard` route from admin-routing.module.ts
- Converted all admin routes to lazy-loaded (removed eager imports of AdminDashboardComponent and CaseManagementComponent)
- Used relative import paths (`./dashboard/...`) instead of `../admin/...`

## Files Changed
- `frontend/src/app/core/layout/sidebar/sidebar.component.ts` — removed operator-dashboard nav item
- `frontend/src/app/features/admin/admin-routing.module.ts` — removed route, converted to lazy loading
