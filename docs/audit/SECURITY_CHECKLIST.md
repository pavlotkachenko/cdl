# Security Checklist — CDL Ticket Management

Pre-launch security review. Every item must be verified before moving to production.

---

## Authentication & Authorization

- [ ] JWT tokens expire in 7 days (verify `expiresIn: '7d'` in `auth.controller.js`)
- [ ] JWT includes `role` claim and is verified on every protected route
- [ ] `authenticate` middleware applied to all non-public routes
- [ ] `authorize(role)` middleware applied to all role-restricted routes
- [ ] Passwords hashed with bcrypt (10 salt rounds) — never stored in plaintext
- [ ] Auth errors return generic "Invalid credentials" (never reveal if email exists)
- [ ] `supabaseAnon` used for `signInWithPassword` — NOT shared admin client (BUG-003)
- [ ] Refresh token rotation implemented or session invalidation on logout

## Rate Limiting

- [x] `express-rate-limit` installed (Sprint 026 LH-1)
- [x] Auth routes (`/api/auth/*`) limited to 100 req / 15 min
- [x] Public submit (`/api/cases/public-submit`) limited to 10 req / 15 min
- [ ] Rate limits verified in staging environment
- [ ] Consider tightening auth limit to 20 req / 15 min before launch

## CORS

- [x] CORS origin whitelist implemented (Sprint 026 LH-1)
- [x] `FRONTEND_URL` env var controls allowed origin
- [x] `PRODUCTION_URL` env var adds production domain to whitelist
- [ ] Wildcard (`*`) not used in production CORS config
- [ ] `credentials: true` only when origin list is specific (not `*`)

## Input Validation

- [ ] All request inputs validated via `express-validator` at controller boundaries
- [ ] File uploads: MIME type validated, max size enforced (10MB)
- [ ] File uploads: max 10 documents per case enforced
- [ ] No `innerHTML` binding in Angular templates (XSS)
- [ ] User-generated content sanitized before rendering

## Database Security

- [ ] RLS (Row-Level Security) enabled on all Supabase tables
- [ ] RLS policies tested with different role contexts
- [ ] No raw SQL string concatenation — all queries use Supabase client (parameterized)
- [ ] `supabaseAdmin` used ONLY for server-side operations requiring RLS bypass

## API Security

- [ ] No stack traces exposed in API responses
- [ ] Error responses follow `{ error: { code, message } }` format
- [ ] Sensitive fields (passwords, tokens) never returned in responses
- [ ] Attorney phone masking applied (last 4 digits only) when role is `attorney`
- [ ] HTTPS enforced in production (HSTS header via Helmet)

## Environment & Secrets

- [ ] `.env` file not committed to git (verify `.gitignore`)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` only used server-side — never exposed to frontend
- [ ] `STRIPE_SECRET_KEY` only used server-side
- [ ] `SENDGRID_API_KEY` only used server-side
- [ ] `JWT_SECRET` is a strong random string (≥32 chars)
- [ ] All required env vars documented in `.env.example`

## Frontend Security

- [ ] No Angular `bypassSecurityTrustHtml` usage without explicit sanitization review
- [ ] Auth tokens stored in memory or secure cookie — NOT localStorage in production
- [ ] Route guards prevent unauthorized page access
- [ ] `AuthGuard` applied to all protected routes in `app-routing.module.ts`
- [ ] Role-specific guards (`driverGuard`, `carrierGuard`, `operatorGuard`) applied

## Payments (Stripe)

- [ ] Stripe secret key never sent to frontend
- [ ] Only `publishableKey` exposed via `/api/payments/config`
- [ ] Payment confirmations verified server-side (webhook or `paymentIntent.retrieve`)
- [ ] PCI DSS compliance: card data never touches backend server
- [ ] Stripe webhook signature verified using `stripe.webhooks.constructEvent`

## Logging & Monitoring

- [ ] No PII (emails, names, phone numbers) in production log output
- [ ] Error logs capture enough context for debugging without exposing secrets
- [ ] `console.log` statements removed or gated behind `NODE_ENV !== 'production'`
- [ ] Uncaught exception handler in place (`process.on('uncaughtException', ...)`)

## Infrastructure

- [ ] HTTPS / TLS certificate configured for production domain
- [ ] Helmet middleware enabled (already in `server.js`)
- [ ] `morgan('combined')` logging in production (already conditional)
- [ ] Health check endpoint (`/health`, `/api/health`) accessible but rate-limited

---

## Sign-off

| Area | Reviewer | Date | Status |
|------|---------|------|--------|
| Auth & Authorization | | | |
| Rate Limiting & CORS | | | |
| Input Validation | | | |
| Database Security | | | |
| Secrets & Environment | | | |
| Payments | | | |
| Frontend | | | |
