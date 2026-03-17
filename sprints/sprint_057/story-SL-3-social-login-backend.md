# Story SL-3: Social Login — Backend OAuth Callback & User Provisioning

**Status:** TODO
**Priority:** P0
**Sprint:** 057

## Description
Handle the OAuth callback from Supabase, create/link user records in the `users` table, assign JWT tokens, and handle role selection for new social login users.

## Implementation Plan
1. Add `/api/auth/oauth/callback` endpoint that receives Supabase OAuth session data
2. Check if user with matching email exists in `users` table
3. If existing user: generate JWT with their role, return token + user data
4. If new user: create user record, redirect to role selection page
5. Add `/api/auth/oauth/complete-profile` for new users to set their role

## Files to Modify
- `backend/src/controllers/auth.controller.js` — add `oauthCallback`, `completeProfile` methods
- `backend/src/routes/auth.routes.js` — add OAuth routes
- `backend/src/services/auth.service.js` — add OAuth user lookup/creation logic

## External Configuration Required
- Supabase Dashboard: enable Google and Facebook auth providers with client ID/secret
- Google Cloud Console: create OAuth 2.0 credentials
- Facebook Developer Portal: create app with Facebook Login product

## Acceptance Criteria
- [ ] OAuth callback creates JWT for existing users
- [ ] New OAuth users are created in `users` table with `pending` role
- [ ] Role selection page shown for new OAuth users before accessing dashboard
- [ ] Account linking: OAuth login with existing email links to existing account
- [ ] No duplicate user records created for repeat OAuth logins
- [ ] Generic error messages (no OAuth provider details leaked)
