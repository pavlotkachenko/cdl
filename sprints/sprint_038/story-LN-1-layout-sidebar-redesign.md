# Story LN-1: Layout & Sidebar Redesign with i18n

**Status:** DONE

## Description
Redesign the main application layout component and sidebar navigation. Update header with
clickable logo linking to home, add translate pipes for all UI labels (profile, settings,
help, logout). Restructure sidebar navigation with updated styling.

## Acceptance Criteria
- [x] Header logo is clickable and links to home (`/`)
- [x] Header menu items use translate pipes (`HEADER.MY_PROFILE`, `HEADER.SETTINGS`, etc.)
- [x] Sidebar navigation restructured with updated HTML and styles
- [x] Layout component styles cleaned up
- [x] Auth service extended with additional functionality

## Files Changed
- `frontend/src/app/core/layout/layout.component.html` — logo as link, translate pipes for menu items
- `frontend/src/app/core/layout/layout.component.scss` — style updates
- `frontend/src/app/core/layout/layout.component.ts` — imports updated
- `frontend/src/app/core/layout/sidebar/sidebar.component.html` — restructured navigation
- `frontend/src/app/core/layout/sidebar/sidebar.component.scss` — restyled
- `frontend/src/app/core/layout/sidebar/sidebar.component.ts` — logic updates
- `frontend/src/app/core/services/auth.service.ts` — extended functionality
