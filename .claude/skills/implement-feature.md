# Skill: Implement Feature

Full-stack feature implementation pipeline. This replaces the CrewAI sequential crew pattern (requirements → design → implement → test → review → ship).

## Trigger

Use when the user requests a new feature or significant enhancement. Example:
- "Implement ticket submission with OCR"
- "Add carrier fleet dashboard"
- "Build the payment plans UI"

## Prerequisites

**Before running this skill**, the `decompose-requirement` skill MUST have been run first. The Product Manager must have produced a Product Brief with scoped user stories, and the user must have approved the breakdown.

If no Product Brief exists yet, run `decompose-requirement` first.

This skill runs **once per user story** from the Product Brief, in the dependency order specified.

## Pipeline Steps

### Step 1: Story Confirmation (Product Manager)

**HARD GATE — verify the sprint story file exists on disk before writing a single line of code:**

```bash
ls sprints/ | sort | tail -1   # confirm sprint folder exists
ls sprints/sprint_XXX/         # confirm individual story files exist
```

- Sprint folder missing → **STOP. Run `decompose-requirement` first**, create the sprint folder and story files, then return here.
- Sprint folder exists but contains only an overview (no `story-<PREFIX>-N-*.md` files) → **STOP. Create the missing story files** from the product brief, then return here.
- Only continue once the specific story file for the current work exists on disk.

Once confirmed:

1. Reference the story number, title, and acceptance criteria from the file
2. Verify prerequisites (dependent stories) are already completed
3. Check `docs/HARD_BUGS_REGISTRY.md` for related known issues

**Output:** Confirmed story scope with acceptance criteria — story file path stated explicitly

### Step 2: Architecture Design (Architect)

Design the complete solution before coding:

1. **Database changes:** New tables, columns, RLS policies, indexes, migrations
2. **API contract:** Endpoints, request/response schemas, auth requirements
3. **Component tree:** Angular components to create or modify
4. **Data flow:** UI → API → DB and back, including real-time if needed

**Output:** Design document following the template in `.claude/agents/architect.md`

### Step 3: UX Review (UX Expert)

**Required for any story that includes frontend changes. Skip for backend-only stories.**

Review the Architect's design through a UX lens:

1. **User flow mapping** — Walk through every screen the user will see, count clicks
2. **3-click verification** — Primary action must complete in ≤ 3 clicks/taps
3. **Mobile layout spec** — Define component placement for 375px viewport first
4. **Desktop layout spec** — Scale up the mobile design to 1024px+
5. **Component mapping** — Map every UI element to existing shared components and design tokens
6. **Accessibility checklist** — Color contrast, touch targets, keyboard nav, ARIA, focus management
7. **Persona validation** — Verify UX matches the target persona's tech comfort level
8. **Loading/error/empty states** — Define what the user sees in every non-happy-path state

**Output:** UX Review document following the template in `.claude/agents/ux-expert.md`

If the UX Expert identifies 3-click violations, accessibility failures, or design system inconsistencies, the Architect must revise the design before proceeding.

### Step 4: Backend Implementation (Dev Lead)

Build the server-side first (APIs need to exist before the frontend can call them):

1. Create/update Supabase migration files
2. Create/update service files (`backend/src/services/`)
3. Create/update controller files (`backend/src/controllers/`)
4. Create/update route files (`backend/src/routes/`)
5. Register routes in `backend/src/app.js` if new
6. Verify with: `cd backend && node src/server.js` (smoke test)

**Output:** Working API endpoints

### Step 5: Frontend Implementation (Dev Lead)

Build the user interface **following the UX Expert's screen specifications**:

1. Create/update Angular components in `frontend/src/app/features/<role>/`
2. Create/update services in `frontend/src/app/services/`
3. Update routing in `frontend/src/app/app.routes.ts`
4. Follow all conventions from `frontend/.claude/CLAUDE.md`
5. **Use only design tokens from `_variables.scss`** — no inline styles, no new colors
6. **Use existing shared components** from `frontend/src/app/shared/components/` before creating new ones
7. **Implement mobile layout first**, then add desktop breakpoints
8. Verify with: `cd frontend && ng build`

**Output:** Working UI connected to backend, matching UX spec

### Step 6: Test Writing (QA Tester)

**Per-file requirement (Sprint Testing Mandate):** For EVERY file created or modified in Steps 4 and 5, a corresponding test file MUST be created or updated. Build the coverage matrix first (see `test-suite` skill, Step 0) before writing tests.

File mapping rules:
- `backend/src/services/<name>.service.js` → `backend/src/__tests__/<name>.test.js`
- `backend/src/controllers/<name>.controller.js` → `backend/src/__tests__/<name>.test.js`
- `frontend/src/**/<name>.component.ts` → co-located `<name>.component.spec.ts`
- `frontend/src/**/<name>.service.ts` → co-located `<name>.service.spec.ts`

Minimum test requirements per file:
1. **Backend service/controller** — happy path + at least one error/validation case per public function
2. **Frontend component** — creation test + key interaction or signal state test per component
3. **E2E** — one Cypress spec covering the complete primary user flow for the story
4. **Accessibility** — AXE checks pass for all new/modified Angular components

Record all test files in the sprint's `story-X.Y-tests.md` (create it if it doesn't exist).

Run and verify all tests pass:
```bash
cd backend && npm test
cd frontend && npx ng test --no-watch
cd frontend && npm run cy:run
```

**Output:** Coverage matrix complete (no ❌ rows), all tests passing

### Step 7: Critic Review (Critic)

Run the full review checklist from `.claude/agents/critic.md`:

1. Security audit (OWASP, RLS, auth)
2. DRY check
3. Performance review
4. Accessibility audit
5. Architecture alignment check
6. **UX compliance** — verify implementation matches the UX Expert's spec

**Output:** Review verdict (APPROVED / CHANGES REQUIRED / BLOCKED)

### Step 8: Ship (DevOps — requires human approval)

If critic approves:

1. Create feature branch: `feat/<feature-name>`
2. Stage only relevant files
3. Commit with conventional message
4. Push to remote
5. Create PR with quality gates checklist
6. **WAIT for human approval** before merge

**Output:** PR URL ready for human review

## Abort Conditions

- **Stop before Step 1** if no Product Brief exists — run `decompose-requirement` first
- **Stop at Step 1** if prerequisite stories are not complete — implement them first
- **Stop at Step 3** if UX review finds 3-click violations or accessibility failures — revise design first
- **Stop at Step 7** if the critic verdict is BLOCKED — fix issues before proceeding
- **Stop at Step 8** if tests are failing — fix before creating PR
