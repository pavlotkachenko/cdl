# Story 23.7 — Security Audit (Launch Gate 7)

**Epic:** Launch Gate Sprint
**Sprint:** 019
**Priority:** CRITICAL
**Status:** TODO

## User Story

As the platform owner,
I want to pass an OWASP Top 10 security review before launch,
so we don't expose driver PII or payment data to attackers.

## Scope

Pass security audit covering OWASP Top 10 to meet Launch Gate 7.

## OWASP Top 10 Checklist

### A01 — Broken Access Control
- [ ] Every backend route has `verifyToken` middleware
- [ ] Every route with role restriction has role check (`req.user.role === 'driver'` etc.)
- [ ] RLS policies tested: driver cannot access other driver's cases
- [ ] Attorney cannot access cases not assigned to them
- [ ] `supabaseAdmin` never used for operations that should respect RLS

### A02 — Cryptographic Failures
- [ ] No sensitive data (passwords, tokens) stored in localStorage
- [ ] JWT uses HS256 or RS256 with secret from env var (not hardcoded)
- [ ] Passwords hashed with bcrypt (10+ rounds)
- [ ] No PII logged to console in production

### A03 — Injection
- [ ] All database queries use Supabase parameterized API (no raw SQL string concat)
- [ ] No `eval()` or `Function()` in backend code
- [ ] File upload: type and size validated before processing

### A04 — Insecure Design
- [ ] Password reset uses time-limited token (not email-guessable)
- [ ] Auth errors are generic: "Invalid credentials" (not "Email not found")
- [ ] Rate limiting on `/api/auth/signin` and `/api/auth/register`

### A05 — Security Misconfiguration
- [ ] CORS whitelist specific origins (no `*` in production)
- [ ] No `.env` files committed to git (`git log --all -- .env` returns nothing)
- [ ] `X-Content-Type-Options: nosniff` header set
- [ ] `X-Frame-Options: DENY` header set
- [ ] No stack traces in API error responses

### A06 — Vulnerable Components
- [ ] `npm audit` in backend returns 0 high/critical vulnerabilities
- [ ] `npm audit` in frontend returns 0 high/critical vulnerabilities

### A07 — Auth Failures
- [ ] JWT expiry enforced (7-day max, verify `exp` claim)
- [ ] Refresh token rotation implemented or single-use token
- [ ] Logout invalidates session (token blacklist or short expiry)

### A08 — Software Integrity
- [ ] `package-lock.json` committed and CI uses `npm ci` not `npm install`
- [ ] No `*` version ranges for security-sensitive packages

### A09 — Logging Failures
- [ ] Auth failures logged server-side (IP, timestamp, attempted email — not password)
- [ ] Payment events logged (intent created, confirmed, failed)
- [ ] No PII in log messages

### A10 — SSRF
- [ ] No user-supplied URLs fetched server-side
- [ ] Webhook endpoints validate Stripe signature (`stripe.webhooks.constructEvent`)

## Verification Commands

```bash
# Dependency audit
cd backend && npm audit --audit-level=high
cd frontend && npm audit --audit-level=high

# Check for hardcoded secrets
grep -r "sk_live\|sk_test\|supabase.*key\|JWT_SECRET" backend/src --include="*.js" | grep -v ".env"

# Check for raw SQL
grep -r "\.query(\|raw(" backend/src --include="*.js"

# Verify CORS config
grep -A5 "cors(" backend/src/app.js

# Check no alert() calls remain
grep -r "alert(" frontend/src --include="*.ts"

# Verify auth middleware on all routes
grep -rn "router\.\(get\|post\|put\|delete\|patch\)" backend/src/routes/ | grep -v "verifyToken" | grep -v "auth.routes"
```

## Acceptance Criteria

- [ ] All OWASP A01–A10 checks pass
- [ ] `npm audit` returns 0 high/critical in both backend and frontend
- [ ] No hardcoded secrets found in source code
- [ ] Stripe webhook signature validation confirmed
- [ ] Findings (including PASS items) documented in `sprints/sprint_019/security-audit-results.md`

## Files to Modify (if issues found)

- `backend/src/app.js` — CORS, security headers
- `backend/src/middleware/auth.middleware.js` — any missing role checks
- `backend/src/routes/*.js` — any routes missing `verifyToken`
- `backend/src/services/payment.service.js` — Stripe webhook signature
