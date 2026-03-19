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

## Progress Checkpoints

After completing each major step (1, 2, 3, 4/5, 6, 7, 8, 9), update `claude-progress.txt` with:
- Which step just completed and its output summary
- Which step is next
- Any decisions made that are not captured in story files

This prevents context loss if compaction occurs mid-pipeline.

---

## Pipeline Steps

### Step 1: Story Confirmation (Product Manager)

**HARD GATE — verify the sprint story file exists on disk before writing a single line of code:**

```bash
ls sprints/ | sort | tail -1   # confirm sprint folder exists
ls sprints/sprint_XXX/         # confirm individual story files exist
```

- Sprint folder missing → **STOP. Run `decompose-requirement` first.** That skill's Step 7 creates the sprint folder and all story files automatically after user approval. Then return here.
- Sprint folder exists but contains only an overview (no `story-<PREFIX>-N-*.md` files) → **STOP.** Re-run `decompose-requirement` Step 7 to create the missing individual story files from the approved product brief. File naming: `story-<PREFIX>-<N>-<title>.md` (see template in `.claude/templates/sprint-story-template.md`).
- Only continue once the specific story file for the current work exists on disk.

Once confirmed:

1. Reference the story number, title, and acceptance criteria from the file
2. Verify prerequisites (dependent stories) are already completed
3. Check `docs/HARD_BUGS_REGISTRY.md` for related known issues

**Output:** Confirmed story scope with acceptance criteria — story file path stated explicitly

### Step 1b: Hidden Requirements Check (Product Manager)

**Required when implementing from an HTML template or design mockup.**

Before architecture design, verify the Product Brief captured all hidden requirements:

1. **Data Layer Gaps** — Compare template fields against `supabase_schema.sql`. Flag missing columns, enum mismatches, new validation rules.
2. **API Contract Gaps** — Compare template form submissions against route validation in `backend/src/routes/`. Flag missing fields in request validators, payload key mismatches (camelCase vs snake_case), new validation rules not yet in controllers.
3. **Asset & Icon Inventory** — Extract every `<img>`, `<svg>`, icon class, and background-image from the template. Cross-reference against `frontend/src/assets/`. Flag missing icons/images and add them as story scope items.
4. **Integration Points** — Identify all service calls, WebSocket events, third-party API references. Verify each has a corresponding backend endpoint.
5. **Stale File Detection** — If the template replaces an existing component, check for orphaned `.html`, `.scss`, or `.ts` files that should be deleted.
6. **Conditional Logic** — Identify show/hide rules, conditional fields, dynamic form behavior. Ensure each is captured in acceptance criteria.

If gaps are found that weren't in the original sprint stories, update the story files before proceeding.

**Output:** Confirmed — all hidden requirements captured in sprint stories, or stories updated with newly discovered requirements.

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

### Step 4b: Asset & Icon Creation (Dev Lead)

**Required when Step 1b identified missing icons or assets.**

Before frontend implementation, create all required visual assets:

1. **SVG Icons** — Create inline SVG components or add SVG files to `frontend/src/assets/icons/`. Prefer inline SVGs for small icons (< 2KB). Use the project's color tokens — never hardcode hex values in SVGs.
2. **Images** — Add to `frontend/src/assets/images/`. Optimize for web (< 50KB per image). Provide 1x and 2x variants for raster images.
3. **Fonts/Icon Fonts** — If the template references an icon font not yet installed (e.g., Material Symbols, Lucide), add it to `angular.json` styles array. Prefer SVG over icon fonts for custom icons.
4. **Verify** — Confirm every asset referenced in the template exists in the assets directory before proceeding to frontend implementation.

**Output:** All missing assets created and verified

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

1. Run `code-review` plugin as automated first pass
2. Security audit (OWASP, RLS, auth)
3. DRY check
4. Performance review
5. Accessibility audit
6. Architecture alignment check
7. **UX compliance** — verify implementation matches the UX Expert's spec

**Output:** Review verdict (APPROVED / CHANGES REQUIRED / BLOCKED)

**On CHANGES REQUIRED or BLOCKED → enter Remediation Loop (see below)**

### Step 8: Documentation Update (Docs Writer)

After Critic approves, update project documentation to reflect what was built:

1. **API Specification** — If new/modified endpoints were created in Steps 4, add or update entries in `docs/API_SPECIFICATION.md` following the format in `.claude/agents/docs-writer.md`
2. **Functional Requirements** — If the implementation changes behavior described in `docs/04_FUNCTIONAL_REQUIREMENTS.md`, update the relevant section
3. **Bug Registry** — If bug fixes were included, add entries to `docs/HARD_BUGS_REGISTRY.md`
4. **Glossary** — If new domain terms were introduced (new status values, role types, feature names), add to `docs/GLOSSARY.md`
5. **Schema Reference** — If migrations were created, note the new migration in the relevant doc section (do NOT modify `supabase_schema.sql` directly — it's hook-protected)
6. **Sprint Story Closure** — Mark all acceptance criteria as checked in the story file, set status to `DONE`

**Skip docs that weren't affected.** Only update what changed. Do not create speculative documentation for unbuilt features.

**Output:** List of docs updated with brief summary of changes

### Step 9: Ship (DevOps — requires human approval)

If critic approves and docs are updated:

1. Create feature branch: `feat/<feature-name>`
2. Stage only relevant files (including updated docs)
3. Commit with conventional message
4. Push to remote
5. Create PR with quality gates checklist
6. **WAIT for human approval** before merge

**Output:** PR URL ready for human review

---

## Escalation & Remediation Loops

When a gate rejects work, follow these loops instead of stopping dead.

### UX Rejection Loop (Step 3 → Step 2)

**Trigger:** UX Expert finds 3-click violations, accessibility failures, or design system inconsistencies.

```
Step 3 (UX rejects) → Architect revises design (Step 2) → UX re-reviews (Step 3)
Max iterations: 2
```

1. UX Expert documents specific issues with file/component references
2. Architect revises ONLY the flagged items (not a full redesign)
3. UX Expert re-reviews ONLY the revised items
4. If still failing after 2 iterations → **escalate to user** with both perspectives

### Critic Remediation Loop (Step 7 → Step 4/5/6)

**Trigger:** Critic verdict is CHANGES REQUIRED or BLOCKED.

```
Step 7 (Critic flags issues) → Dev Lead fixes (Step 4/5) → QA updates tests (Step 6) → Critic re-reviews (Step 7)
Max iterations: 3
```

1. Critic produces structured issue list (Critical / Warning / Suggestion)
2. Dev Lead fixes all Critical and Warning items. Suggestions are optional.
3. QA Tester updates tests if the fix changed behavior
4. Critic re-reviews ONLY the changed files (not full review)
5. **BLOCKED** issues (security, missing RLS, hardcoded secrets) must be fixed before ANY other work
6. If still failing after 3 iterations → **escalate to user** with full history

### Test Failure Loop (Step 6 → Step 4/5)

**Trigger:** Tests fail after implementation.

```
Step 6 (tests fail) → Dev Lead debugs using Debugging Protocol → Dev Lead fixes → QA re-runs tests
Max iterations: 3 (matches Circuit Breaker)
```

1. Dev Lead follows the 4-phase Debugging Protocol from `dev-lead.md`
2. Fix is applied, full test suite re-run
3. If 3 fixes fail → Circuit Breaker activates → escalate to user

### Escalation to User

When any loop hits its max iterations, present:
- **What was attempted** (numbered list of changes made)
- **What the reviewer/test still flags** (exact error or review comment)
- **Your recommendation** (what you think the right fix is and why)
- **Options:** (a) approve current state with known issues, (b) provide guidance, (c) defer the story

---

## Abort Conditions

- **Stop before Step 1** if no Product Brief exists — run `decompose-requirement` first
- **Stop at Step 1** if prerequisite stories are not complete — implement them first
- **Stop at Step 3** if UX rejection loop exhausted (2 iterations) — escalate to user
- **Stop at Step 7** if critic remediation loop exhausted (3 iterations) — escalate to user
- **Stop at Step 9** if tests are failing — fix before creating PR
