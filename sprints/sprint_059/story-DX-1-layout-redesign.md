# Story DX-1: Layout Redesign — Collapsible Sidebar & Custom Topbar

## Status: DONE

## Description
Replaced Angular Material toolbar with a custom topbar. Added desktop sidebar collapse/expand functionality (icon-only mode vs full). Improved mobile overlay behavior.

## Files Modified
- `frontend/src/app/core/layout/layout.component.ts` — added `sidebarCollapsed` state, split toggle logic for mobile vs desktop
- `frontend/src/app/core/layout/layout.component.html` — custom topbar markup, conditional sidebar width classes
- `frontend/src/app/core/layout/layout.component.scss` — removed MatToolbar styles, added collapsed sidebar styles
- `frontend/src/app/core/layout/sidebar/sidebar.component.ts` — accepts collapsed input, conditional label visibility
- `frontend/src/app/core/layout/sidebar/sidebar.component.html` — icon-only mode when collapsed
- `frontend/src/app/core/layout/sidebar/sidebar.component.scss` — collapsed width, tooltip on hover

## Acceptance Criteria
- [x] Sidebar collapses to icon-only mode on desktop
- [x] Sidebar uses overlay on mobile
- [x] Custom topbar replaces Material toolbar
- [x] Sidebar expand/collapse transition is smooth
