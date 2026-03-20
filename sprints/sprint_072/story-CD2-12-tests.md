# Story CD2-12 — Test Updates

**Status:** TODO
**Priority:** P0

## Description

Update and extend the Case Detail component test suite to cover all redesign changes. Target 70+ tests total (65 existing + 5 new).

## Acceptance Criteria

- [ ] All 65 existing tests continue to pass after redesign changes
- [ ] 5+ new test cases added covering redesign-specific behavior
- [ ] Tests verify `aria-hidden="true"` on emoji spans and decorative elements
- [ ] Tests verify `prefers-reduced-motion` media query presence in styles
- [ ] Tests verify role-based avatar color classes in messages section
- [ ] Tests verify availability dot `aria-hidden` on attorney card
- [ ] Tests verify `doc.fileSize` undefined guard in documents section
- [ ] All 70+ tests pass via `cd frontend && npx ng test --no-watch`

## Files Modified

- `frontend/src/app/features/driver/case-detail/case-detail.component.spec.ts`
