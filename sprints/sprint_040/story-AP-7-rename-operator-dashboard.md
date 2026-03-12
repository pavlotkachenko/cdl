# Story AP-7: Rename Operator Dashboard to Admin Dashboard

**Status:** DONE

## Description
Renamed "Operator Dashboard" to "Admin Dashboard" in the sidebar navigation and the
operator dashboard component heading.

## Changes
- Sidebar: changed icon from 'support_agent' to 'admin_panel_settings'
- NAV.OPERATOR_DASHBOARD translation value changed to "Admin Dashboard" (EN), "Panel de Administración" (ES), "Tableau d'administration" (FR)
- Operator dashboard component heading uses ADMIN.OPS_DASHBOARD translate key

## Files Changed
- `frontend/src/app/core/layout/sidebar/sidebar.component.ts` — icon change
- `frontend/src/assets/i18n/en.json` — NAV.OPERATOR_DASHBOARD value updated
- `frontend/src/assets/i18n/es.json` — NAV.OPERATOR_DASHBOARD value updated
- `frontend/src/assets/i18n/fr.json` — NAV.OPERATOR_DASHBOARD value updated
- `frontend/src/app/features/admin/operator-dashboard/operator-dashboard.component.ts` — heading uses translate pipe
