# Story SL-2: Social Login — Frontend OAuth Buttons

**Status:** TODO
**Priority:** P0
**Sprint:** 057

## Description
Add "Continue with Google" and "Continue with Facebook" buttons to the login page. Wire them to Supabase's `signInWithOAuth()` method which handles the full OAuth redirect flow.

## Implementation Plan
1. Add social login buttons to login component template (below the login form)
2. Add `signInWithGoogle()` and `signInWithFacebook()` methods to AuthService
3. Use Supabase client's `auth.signInWithOAuth({ provider: 'google' | 'facebook' })`
4. Handle OAuth callback redirect — Supabase returns to a configured redirect URL with session tokens
5. On successful OAuth return, check if user exists in `users` table, if not prompt for role selection

## Files to Modify
- `frontend/src/app/features/auth/login/login.component.ts` — add social buttons + click handlers
- `frontend/src/app/features/auth/login/login.component.html` — add button markup
- `frontend/src/app/core/services/auth.service.ts` — add OAuth methods
- `frontend/src/app/app.routes.ts` — add `/auth/callback` route for OAuth redirect

## Acceptance Criteria
- [ ] "Continue with Google" button with official Google icon shown on login page
- [ ] "Continue with Facebook" button with official Facebook icon shown on login page
- [ ] Buttons styled per platform brand guidelines (white bg for Google, blue bg for Facebook)
- [ ] Clicking triggers Supabase OAuth redirect
- [ ] OAuth callback route handles token extraction and user provisioning
- [ ] Mobile-first layout, buttons are full-width on small screens
- [ ] WCAG 2.1 AA: buttons are keyboard-navigable with visible focus indicators
