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

Confirm which story from the Product Brief is being implemented:

1. Reference the story number, title, and acceptance criteria
2. Verify prerequisites (dependent stories) are already completed
3. Check `docs/HARD_BUGS_REGISTRY.md` for related known issues

**Output:** Confirmed story scope with acceptance criteria

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

Write comprehensive tests:

1. **Backend:** Jest tests in `backend/src/__tests__/`
   - At minimum: happy path + error case for each service function
2. **Frontend:** `.spec.ts` files co-located with components
   - At minimum: component creation + key interaction tests
3. **E2E:** Cypress test for the primary user flow
   - At minimum: complete happy path end-to-end
4. **Accessibility:** Verify AXE checks pass for new components

Run and verify all tests pass:
```bash
cd backend && npm test
cd frontend && ng test --watch=false --browsers=ChromeHeadless
cd frontend && npm run cy:run
```

**Output:** All tests passing

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
