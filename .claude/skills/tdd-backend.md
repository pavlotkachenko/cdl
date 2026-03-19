---
name: tdd-backend
description: Red-Green-Refactor TDD cycle for backend services, routes, and bug fixes. Opt-in — invoke explicitly, not applied globally.
---

# TDD Backend Implementation

Strict Test-Driven Development for backend code. Write the test first. Watch it fail. Write minimal code to pass.

**Core principle:** If you didn't watch the test fail, you don't know if it tests the right thing.

## When to Use

Invoke this skill explicitly for:
- New backend services (`backend/src/services/*.js`)
- New API route handlers / controllers (`backend/src/routes/*.js`, `backend/src/controllers/*.js`)
- Bug fixes — write the regression test FIRST, see it fail, then fix
- Utility functions (`backend/src/utils/*.js`)

## When NOT to Use (use standard implement-feature flow)

- Angular components, templates, SCSS
- Database migrations (no test-first for DDL)
- Configuration files, environment setup
- Seed data / test fixtures
- One-line changes where the test already exists and covers the behavior
- Frontend services (Angular DI + TestBed setup makes strict TDD impractical)

## Prerequisites

Before starting TDD:
1. Sprint story files MUST exist (this skill does not bypass the decompose-requirement gate)
2. Architect design MUST be approved (you need the API contract / interface to write tests against)
3. You know which test file to use: `backend/src/__tests__/<name>.test.js`

## The Cycle

### RED — Write a Failing Test

1. Open or create the test file following project conventions
2. Write **ONE** test case for the next behavior increment
3. The test should describe **what** the function does, not **how**:
   ```javascript
   // GOOD: describes behavior
   it('should return only cases belonging to the given user', async () => { ... });

   // BAD: describes implementation
   it('should call supabase.from with cases table', async () => { ... });
   ```
4. Run the test: `cd backend && npx jest --testPathPattern="<test-file>" --no-coverage`
5. **It MUST fail.** If it passes, the test is wrong — delete it and rethink
6. Verify the failure message describes the **missing behavior** (not a syntax error, import error, or mock setup issue)

### GREEN — Minimal Code to Pass

7. Write the **MINIMUM** production code to make the failing test pass
8. Do not write code for the next test case. Do not add error handling you haven't tested yet. Do not refactor yet.
9. Run the single test again. It must pass now.
10. Run the full backend suite: `cd backend && npm test --no-coverage`
11. **No existing tests may break.** If one does, fix it before proceeding.

### REFACTOR — Clean Up (Only If Needed)

12. Look for duplication between the new code and existing code
13. Rename unclear variables or functions
14. Extract shared logic into utilities (only if used in 2+ places NOW, not hypothetically)
15. Run full suite again — everything must still pass
16. **Do not add features during refactor.** Refactor changes behavior zero.

### Repeat

17. Go back to RED for the next behavior increment
18. Each RED-GREEN-REFACTOR cycle should cover one acceptance criterion or one edge case
19. Typical cycle: 1 test case → 5-15 lines of production code

## Cycle Sizing

Keep cycles small. Each cycle should take 2-5 minutes of work, not 30 minutes.

| Good cycle scope | Bad cycle scope |
|-----------------|-----------------|
| "Returns items for a valid user" | "Implement the entire CRUD service" |
| "Throws on missing required field" | "Handle all validation errors" |
| "Returns empty array when no results" | "Handle all edge cases" |

## Integration with Sprint Stories

- Each RED-GREEN-REFACTOR cycle maps to one acceptance criterion where possible
- Update the story acceptance criteria checkboxes as tests pass
- The test file IS the test coverage artifact — no separate `story-*-tests.md` needed for backend TDD stories

## Mock Setup Rules (Jest + Supabase)

Follow the existing mock pattern from `qa-tester.md`:

```javascript
jest.mock('../config/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    single: jest.fn(),
  }
}));
```

For Stripe, Twilio, SendGrid — mock the client, not the HTTP calls.

## The Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

If you wrote production code before the test:
1. Delete the production code
2. Write the test
3. Watch it fail
4. Rewrite the production code from scratch guided by the test

Do NOT:
- Keep the pre-written code as "reference"
- Copy-paste it back after writing the test
- "Adapt" the test to match code you already wrote

The point is that the test drives the design. If the code exists first, the test just rubber-stamps it.

## Exception: Exploratory Spike

If you genuinely don't know what the interface should look like:
1. Say explicitly: "Starting exploratory spike — TDD paused"
2. Write throwaway code to learn the shape of the problem
3. **Delete ALL spike code**
4. Start TDD from scratch with the knowledge gained
5. Say explicitly: "Spike complete — resuming TDD"

The spike code must not survive. It teaches you; it doesn't ship.

## Verification

After all cycles are complete:
1. Run full backend suite: `cd backend && npm test --no-coverage`
2. Show the output (Verification Protocol applies)
3. Confirm all acceptance criteria from the story are covered by tests
4. Hand off to Critic for Gate 3 review
