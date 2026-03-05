# Skill: Test Suite

Generate and run comprehensive tests for a feature or the entire codebase. This replaces the CrewAI QA Engineer and Integration Tester agents.

## Trigger

Use when:
- "Write tests for [feature]"
- "Add test coverage for [component/service]"
- "Run the test suite"
- After implementing a new feature (Step 5 of implement-feature pipeline)
- At the end of a sprint story to verify per-file test coverage

## Test Generation Pipeline

### Step 0: Sprint File Audit (run first when working within a sprint)

Before writing any tests, identify every code file touched by the current sprint story:

1. **From the sprint story file** (`sprints/sprint_XXX/story-X.Y-*.md`), list all files mentioned in the implementation scope.
2. **From git** (if the story has been partially implemented), run:
   ```bash
   git diff --name-only HEAD~1 HEAD -- 'backend/src/**' 'frontend/src/**'
   ```
3. Build a test coverage matrix — one row per touched file:

   | Source File | Expected Test File | Exists? |
   |---|---|---|
   | `backend/src/services/payment.service.js` | `backend/src/__tests__/payment.test.js` | ✅ / ❌ |
   | `frontend/src/.../payment.component.ts` | `frontend/src/.../payment.component.spec.ts` | ✅ / ❌ |

4. **Every ❌ row must be resolved before the story is marked DONE.** Write the missing test file now (Steps 2–4 below).
5. After closing all gaps, record the completed matrix in the sprint's `story-X.Y-tests.md` file (create it if it doesn't exist).

### Step 1: Identify Test Targets

Scan the codebase for untested or under-tested code:

```bash
# Backend: Find services without tests
ls backend/src/services/*.js | while read f; do
  name=$(basename "$f" .service.js)
  if [ ! -f "backend/src/__tests__/${name}.test.js" ]; then
    echo "UNTESTED: $f"
  fi
done

# Frontend: Find components without specs
find frontend/src/app -name "*.component.ts" ! -name "*.spec.ts" | while read f; do
  spec="${f%.ts}.spec.ts"
  if [ ! -f "$spec" ]; then
    echo "UNTESTED: $f"
  fi
done
```

### Step 2: Generate Backend Tests (Jest)

For each backend service/controller, generate tests covering:

1. **Happy path** — Valid inputs return expected outputs
2. **Validation errors** — Invalid inputs are rejected with proper error codes
3. **Auth errors** — Missing/invalid JWT returns 401
4. **Permission errors** — Wrong role returns 403
5. **Not found** — Non-existent resources return 404
6. **Database errors** — Supabase failures are handled gracefully

**File location:** `backend/src/__tests__/<feature>.test.js`

**Pattern:** Mock Supabase client, test service logic in isolation.

### Step 3: Generate Frontend Tests (Angular)

For each component/service, generate tests covering:

1. **Creation** — Component instantiates without errors
2. **Rendering** — Template displays correct data
3. **Inputs** — `input()` bindings pass data correctly
4. **Outputs** — `output()` events emit correctly
5. **Interactions** — Click handlers, form submissions work
6. **Loading states** — Skeleton/spinner shown while loading
7. **Error states** — Error messages display when API fails

**File location:** Co-located `*.spec.ts` file next to the component/service

**Pattern:** Use `TestBed`, mock services via `provideHttpClientTesting`.

### Step 4: Generate E2E Tests (Cypress)

For critical user flows, generate Cypress tests covering:

1. **Complete happy path** — User achieves their goal
2. **Error recovery** — User handles errors gracefully
3. **Navigation** — Routes load correctly, redirects work
4. **Responsive** — Test at mobile viewport (375x667)

**File location:** `frontend/cypress/e2e/<feature>.cy.ts`

**Pattern:** Use `data-testid` selectors, intercept API calls for predictable behavior.

### Step 5: Run All Tests

```bash
# Backend
cd /Users/paveltkachenko/prj/cdl-ticket-management/backend && npm test

# Frontend unit tests
cd /Users/paveltkachenko/prj/cdl-ticket-management/frontend && ng test --watch=false --browsers=ChromeHeadless

# E2E tests (requires running backend + frontend)
cd /Users/paveltkachenko/prj/cdl-ticket-management/frontend && npm run cy:run
```

### Step 6: Report Results

```markdown
## Test Results — [Feature/Date]

### Backend (Jest)
- Total: X tests
- Passed: X
- Failed: X
- Coverage: X%

### Frontend (Angular)
- Total: X tests
- Passed: X
- Failed: X

### E2E (Cypress)
- Total: X specs
- Passed: X
- Failed: X

### Failures (if any)
1. `test name` — `file:line` — Error message — Likely cause
```

## Test Writing Rules

- Every test file MUST have at least one positive and one negative case
- Test names describe behavior: `should return 401 when JWT is missing`
- Mock external services (Supabase, Stripe, Twilio) — never hit real APIs in tests
- Use `data-testid` for Cypress selectors — never CSS classes or tag names
- Keep tests independent — no test should depend on another test's state
- Clean up after each test with `beforeEach` / `afterEach` reset
- Use realistic test data that matches the schema (UUIDs, enums, etc.)
