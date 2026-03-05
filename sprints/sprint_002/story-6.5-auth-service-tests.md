# Story 6.5 — Tests: auth.service.js

**Epic:** Backend Test Coverage
**Priority:** CRITICAL
**Status:** DONE

## User Story
As a developer,
I want unit tests for all auth service functions,
so that security regressions in password, JWT, and token logic are caught immediately.

## Scope
- `validatePasswordStrength` — all 5 rules tested individually (pure function)
- `hashPassword` / `comparePassword` — bcrypt round-trip
- `generateAccessToken` — JWT contains correct claims (userId, role, email, type)
- `generateRefreshToken` — returns token + tokenId pair
- `verifyRefreshToken` — valid token succeeds, expired/tampered throws
- `generateResetToken` — returns 64-char hex string
- `verifyResetToken` — DB mocked: not found throws, `used_at` set throws, expired throws, valid returns userId
- File: `backend/src/__tests__/auth.service.test.js`

## Acceptance Criteria
- [ ] `validatePasswordStrength` returns all 5 error messages for empty string
- [ ] `validatePasswordStrength` returns `valid: true` for a strong password
- [ ] `hashPassword` output verifies correctly with `comparePassword`
- [ ] `comparePassword` returns false for wrong password
- [ ] `generateAccessToken` JWT payload contains `id`, `role`, `email`, `type: 'access'`
- [ ] `verifyRefreshToken` throws "Invalid or expired refresh token" on bad token
- [ ] `verifyResetToken` throws "Reset token already used" when `used_at` is set
- [ ] `verifyResetToken` throws "Reset token expired" when past expiry
