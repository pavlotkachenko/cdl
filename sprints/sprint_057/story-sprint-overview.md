# Sprint 057 — Project Cleanup, Cache Prevention & Social Login

## Goal
Remove all duplicate/stale files from both frontend and backend, prevent Vite cache corruption from recurring, set up Storybook for component documentation, and add Google/Facebook social login via Supabase OAuth.

## Context
An investigation into a login redirect failure revealed that stale Vite dev server cache was the root cause — not a code bug. During diagnosis, an audit found ~70+ duplicate/stale files across the project (backup files, stale route configs, empty placeholder services, a misplaced `app/app/` directory, and an entire unused `landing-page/` module). These were cleaned up. Additionally, social login was requested to reduce friction for new user registration.

## Stories

| # | Story | Priority | Status |
|---|-------|----------|--------|
| CL-1 | Backend: remove stale duplicate files (controllers, services, middleware) | P0 | DONE |
| CL-2 | Frontend: remove stale duplicate files (backups, stale routes, landing-page, misplaced dirs) | P0 | DONE |
| CL-3 | Cache prevention: add prestart/prebuild cache clean scripts | P1 | DONE |
| SB-1 | Storybook: initial setup with Angular Material + Tailwind theming | P2 | DONE |
| SL-1 | Social login: download brand icons and register with MatIconRegistry | P0 | DONE |
| SL-2 | Social login: implement Google/Facebook OAuth buttons on login page | P0 | TODO |
| SL-3 | Social login: backend OAuth callback and user provisioning | P0 | TODO |

## Acceptance Criteria Summary
- No `.bak`/`.backup` files in the repo
- No empty placeholder services/controllers in backend
- No duplicate route configuration files
- `npm start` and `npm run build` auto-clear Angular cache
- Google and Facebook SVG icons registered and usable via `<mat-icon svgIcon="google|facebook">`
- Login page shows "Continue with Google" and "Continue with Facebook" buttons
- Supabase OAuth flow redirects user and creates/links account
