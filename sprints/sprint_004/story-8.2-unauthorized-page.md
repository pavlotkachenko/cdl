# Story 8.2 — /unauthorized Page

**Epic:** Route Security & Auth Hardening
**Priority:** HIGH
**Status:** TODO

## User Story
As any user with the wrong role,
I want to see a clear "You don't have permission" page instead of a blank screen,
so that I understand what happened and can navigate somewhere useful.

## Context
The `authGuard` already calls `router.navigate(['/unauthorized'])` for role mismatches,
but the route and component do not exist yet.

## Scope

### Frontend (route: `/unauthorized`)

**Component:** `UnauthorizedComponent` at `features/auth/unauthorized/`

**Layout:**
- Lock icon (Material `lock` icon, large)
- Heading: "Access Denied"
- Subheading: "You don't have permission to view this page."
- If authenticated: show current role badge and "Go to my dashboard" button → role-based dashboard URL
- Always: "Sign out" button → calls `authService.logout()` → navigates to `/login`

**Design:** centered card, matches login page style, responsive (mobile-first).

### Routing
- Add `{ path: 'unauthorized', loadComponent: ... }` to `app-routing.module.ts`

## Acceptance Criteria
- [ ] Navigating to `/unauthorized` renders the component (no 404)
- [ ] "Go to my dashboard" navigates to the correct role-based dashboard
- [ ] "Sign out" clears auth and redirects to `/login`
- [ ] Component is accessible (WCAG AA): proper heading hierarchy, keyboard-navigable buttons
- [ ] Page renders correctly when user is not authenticated (no crash)
