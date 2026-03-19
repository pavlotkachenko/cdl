# Cherry-Picking Superpowers Skills — Recommendations

> Evaluated against CDL Ticket Management's existing pipeline (CLAUDE.md, 8 agents, 6 skills, commit hooks, stop hooks).

---

## 1. Verification Before Completion

**What it does:** Prevents the agent from claiming "tests pass" or "feature works" without fresh, real evidence. Requires running actual commands and showing output — no memory-based claims allowed.

### Benefits
- **Eliminates false positives** — the #1 failure mode where the agent says "all tests pass" based on stale or imagined results
- **Complements your stop hook** — your `verify-before-stop.sh` catches at session end, but this catches *during* implementation (earlier feedback loop)
- **Zero workflow conflict** — purely additive, doesn't change pipeline order or skip any gates

### Tradeoffs
- Increases token usage — every verification requires running commands and including output in context
- Slows down simple changes — a one-line typo fix still requires fresh test run evidence before claiming done
- Can hit command timeouts on large test suites (your frontend suite: 634 tests)

### Integration Point
Add to **Dev Lead agent** (`dev-lead.md`) and **QA Tester agent** (`qa-tester.md`) as a mandatory post-implementation rule.

### Recommended Adaptation

Add this section to `.claude/agents/dev-lead.md` after the implementation rules:

```markdown
## Verification Protocol (mandatory)

Before claiming ANY task is complete:
1. Run the relevant test command. Show the output. No exceptions.
   - Backend: `cd backend && npm test --no-coverage`
   - Frontend: `cd frontend && npx ng test --no-watch`
2. If you say "tests pass" — the ACTUAL command output must be visible in this conversation.
3. Never verify from memory. Never say "tests passed earlier." Run it NOW.
4. If a test fails, the task is NOT complete. Fix it or flag it as a blocker.

Verification claims without evidence = task reverted to IN PROGRESS.
```

**Risk: LOW.** No pipeline conflicts. Pure safety net.

---

## 2. Strict TDD Enforcement (Red-Green-Refactor)

**What it does:** Inverts your current flow from "implement then test" to "test first, then implement." The iron law: no production code without a failing test first. Code written before a test must be deleted.

### Benefits
- **Catches design flaws early** — writing the test first forces you to think about the API/interface before implementation
- **Guarantees test coverage** — impossible to have untested code if the code only exists to make a test pass
- **Strengthens your Gate 2** — your Sprint Testing Mandate requires test files exist, but TDD ensures tests are *meaningful*, not just present
- **Reduces rework** — bugs caught at test-writing time are 10x cheaper than bugs caught at Critic review

### Tradeoffs
- **Significant workflow change** — your current pipeline is: Dev Lead implements (Step 3) → QA writes tests (Step 4). TDD merges these into a single step
- **Slower for UI/template work** — Angular component templates, SCSS layouts, and visual changes are hard to TDD (what does a "failing test" for a CSS change look like?)
- **Conflicts with your agent separation** — Dev Lead (sonnet) implements, QA Tester (haiku) tests. TDD means the same agent does both. You either merge the roles or have QA write failing tests → Dev Lead makes them pass (awkward handoff)
- **"Delete and start over" rule is impractical** — if the agent writes 200 lines of service code then realizes it didn't write the test first, deleting everything wastes significant context and tokens
- **Not all code is TDD-friendly** — migrations, seed data, configuration, Angular module wiring, Stripe webhook handlers with external dependencies

### Integration Point
**Do NOT add to CLAUDE.md as a global rule.** Instead, create a new skill that the Dev Lead invokes selectively.

### Recommended Adaptation

Create `.claude/skills/tdd-implementation.md`:

```markdown
---
name: tdd-implementation
description: Red-Green-Refactor cycle for service logic and API endpoints
---

# TDD Implementation Mode

## When to Use
- New backend services (`backend/src/services/*.js`)
- New API route handlers (`backend/src/routes/*.js`)
- Frontend services (`frontend/src/app/services/*.service.ts`)
- Utility/helper functions
- Bug fixes (write the regression test FIRST)

## When NOT to Use (use standard implement-feature flow)
- Angular component templates and SCSS
- Database migrations
- Configuration files
- Seed data / test fixtures
- One-line changes where the test already exists

## The Cycle

### RED — Write a failing test
1. Create or open the test file following project conventions:
   - Backend: `backend/src/__tests__/<name>.test.js`
   - Frontend: co-located `*.spec.ts`
2. Write ONE test case for the next behavior increment
3. Run the test. It MUST fail. If it passes, the test is wrong — delete it and rethink
4. Verify the failure message describes the missing behavior (not a syntax error)

### GREEN — Minimal code to pass
5. Write the MINIMUM production code to make the failing test pass
6. Run all tests. The new test must pass. No existing tests may break
7. If you wrote more code than needed, delete the excess

### REFACTOR — Clean up
8. Look for duplication, unclear naming, or structural issues
9. Refactor production code AND test code
10. Run all tests again. Everything must still pass

### Repeat
11. Go back to RED for the next behavior increment
12. Each cycle should be 2-5 minutes of work, not 30 minutes

## Sprint Story Integration
- Update the story acceptance criteria checkboxes as tests pass
- Each RED-GREEN-REFACTOR cycle maps to one acceptance criterion where possible
```

**Risk: MEDIUM.** Requires discipline about when to invoke vs. skip. If made mandatory globally, will slow down UI work significantly.

---

## 3. Systematic Debugging (4-Phase)

**What it does:** Replaces ad-hoc "try random fixes" with a structured 4-phase process: Investigate → Pattern Analysis → Hypothesis Testing → Implementation. Hard rule: 3 failed fixes = stop and question assumptions.

### Benefits
- **Prevents fix loops** — the most expensive failure mode: agent tries 8 variations of the same wrong approach, burning context and tokens
- **Forces root cause analysis** — the agent must gather evidence (logs, stack traces, git blame) before proposing fixes
- **"3 strikes" circuit breaker** — after 3 failed attempts, the agent must step back and question its mental model instead of trying fix #4
- **Fills a gap in your pipeline** — you have no debugging-specific methodology; your Critic catches issues but doesn't prescribe how to fix them

### Tradeoffs
- Adds overhead to simple bugs — a missing comma doesn't need 4-phase investigation
- Requires the agent to track attempt count (state management across turns)
- Phase 2 (Pattern Analysis) can consume significant context reading logs and related code
- May conflict with time-sensitive hotfixes where speed matters more than process

### Integration Point
Add to **Dev Lead agent** as a debugging protocol. Does not change pipeline order.

### Recommended Adaptation

Add to `.claude/agents/dev-lead.md`:

```markdown
## Debugging Protocol (when a test fails or bug is reported)

### Phase 1: Investigate (DO NOT write code yet)
- Read the full error message/stack trace
- Identify the failing file, line, and function
- Check git blame for recent changes to that area
- Read the relevant test to understand expected behavior

### Phase 2: Pattern Analysis
- Is this the same error pattern as a previous failure? Check related test files
- Are there similar patterns elsewhere in the codebase that work? Compare
- Check if the issue is in our code or a dependency

### Phase 3: Hypothesis Testing
- State your hypothesis as: "The bug is caused by X because Y"
- Write or modify ONE test that would confirm/deny the hypothesis
- Run it. Does the result match your hypothesis?

### Phase 4: Implementation
- Fix the root cause (not symptoms)
- Run the full test suite, not just the failing test
- Verify no regressions

### Circuit Breaker
If 3 attempted fixes fail:
1. STOP writing code
2. Re-read the original error with fresh eyes
3. List your assumptions — which one might be wrong?
4. Consider: wrong file? wrong layer? wrong mental model of the data flow?
5. If still stuck after reassessment, flag to user with:
   - What you've tried
   - What you've ruled out
   - Where you think the real issue might be
```

**Risk: LOW.** Purely additive. No pipeline conflicts. Saves tokens on net by preventing fix loops.

---

## 4. Git Worktree Isolation

**What it does:** Creates an isolated copy of the repo (via `git worktree`) for each feature branch, so work-in-progress changes never pollute the main working directory.

### Benefits
- **Prevents accidental cross-contamination** — unstaged changes from one feature can't leak into another
- **Enables safe parallel work** — two subagents can work on different features simultaneously without merge conflicts
- **Easy rollback** — if a feature goes sideways, discard the worktree; main directory untouched
- **Complements your branch workflow** — your CLAUDE.md already requires `feat/<name>` branches; worktrees add filesystem isolation on top

### Tradeoffs
- **Disk space** — each worktree is a full checkout. Your repo has `node_modules` (~500MB+). That's 500MB+ per worktree unless you share `node_modules` via symlinks or hoisting
- **Dependency installation** — each worktree needs its own `npm install` for both `backend/` and `frontend/`. This adds 1-3 minutes per worktree creation
- **Port conflicts** — if two worktrees try to run dev servers or tests simultaneously, they'll fight over ports (4200 for Angular, 3000 for Express)
- **Path confusion** — agents must use absolute paths. A subagent in `/worktrees/feat-x/` can't reference files as `backend/src/...` if the main session expects `/Users/paveltkachenko/prj/cdl-ticket-management/backend/src/...`
- **Your hooks are path-relative** — `verify-before-stop.sh` uses `cd backend && npm test`. This works in the main directory but may fail in a worktree if the worktree path structure differs
- **Not needed for your current workflow** — you work on one sprint at a time, sequentially. Worktrees shine for parallel feature development

### Integration Point
Add as a **DevOps agent** capability, invoked when starting a new sprint branch.

### Recommended Adaptation

Create `.claude/skills/worktree-isolation.md`:

```markdown
---
name: worktree-isolation
description: Create isolated git worktree for feature development
---

# Git Worktree Isolation

## When to Use
- Starting a new sprint branch
- Parallel subagent development (2+ independent stories)
- Risky/experimental changes you might discard

## When NOT to Use
- Quick fixes on the current branch
- Single-story sprints
- Changes that need to be tested together (use one worktree)

## Create Worktree
1. Ensure main working directory is clean: `git status` (stash or commit first)
2. Create: `git worktree add ../cdl-worktree-<sprint> -b feat/<branch-name>`
3. Install deps: `cd ../cdl-worktree-<sprint> && cd backend && npm ci && cd ../frontend && npm ci`
4. Verify baseline: run backend + frontend tests in the worktree
5. All file references must use the ABSOLUTE worktree path

## Cleanup
- When done: merge or PR from the worktree branch
- Remove: `git worktree remove ../cdl-worktree-<sprint>`
- Verify: `git worktree list` should show only the main directory

## Port Management (if running dev servers in worktrees)
- Main: backend 3000, frontend 4200
- Worktree 1: backend 3001, frontend 4201
- Worktree 2: backend 3002, frontend 4202
```

**Risk: MEDIUM.** Disk and time overhead is real. Most valuable if you start doing parallel sprint work. For sequential sprints, the benefit is marginal.

---

## 5. Parallel Subagent Dispatch

**What it does:** Breaks independent tasks into parallel subagents that run concurrently, each in its own context, with structured review when they complete.

### Benefits
- **Halves wall-clock time** — two independent stories (e.g., backend service + unrelated frontend component) complete simultaneously
- **Context isolation** — each subagent gets a fresh context window focused on its task, avoiding the "context stuffing" problem of doing everything sequentially
- **Structured review** — when subagents return, their work is reviewed for spec compliance and code quality before merging
- **Natural fit for your sprint model** — sprints often have 3-6 independent stories that could parallelize

### Tradeoffs
- **Token cost multiplies** — 3 parallel subagents = 3x the API cost for the implementation phase
- **Merge conflicts** — if two subagents modify the same file (e.g., `app.routes.ts`, `environment.ts`, shared SCSS), you get conflicts that must be resolved manually
- **Review overhead** — each subagent's output needs review. With 4 parallel agents, that's 4 review cycles
- **Debugging is harder** — if a parallel subagent produces broken code, you're debugging in a different context without the implementation history
- **Your pipeline is sequential by design** — Decompose → Architect → UX → Dev → QA → Critic → DevOps. Parallelism only applies within the Dev+QA step, for stories that don't touch shared files
- **Subagent quality variance** — subagents don't have the full conversation history. They may miss conventions, produce inconsistent patterns, or duplicate utilities that another subagent already created

### Integration Point
Add to **Dev Lead agent** as an optional dispatch strategy when 2+ stories are file-independent.

### Recommended Adaptation

Add to `.claude/agents/dev-lead.md`:

```markdown
## Parallel Story Dispatch (optional, for 2+ independent stories)

### Prerequisites (ALL must be true)
- Stories have been decomposed (sprint story files exist)
- Architect design is approved
- UX review is complete (for frontend stories)
- Stories do NOT share any files (check scope sections in story files)

### File Independence Check
Before dispatching, verify no two stories touch the same file:
1. Read each story's scope/files section
2. Build a file list per story
3. If ANY file appears in 2+ stories → those stories run SEQUENTIALLY, not parallel

### Shared Files That Almost Always Conflict
- `app.routes.ts` — route registration
- `environment.ts` / `environment.prod.ts` — config
- `_variables.scss` — design tokens
- `app.config.ts` — provider registration
- Database migration files (sequential by number)
- `package.json` — dependency additions

### Dispatch Protocol
For each independent story, launch a subagent with:
1. The full story file content (acceptance criteria, scope, files)
2. Project conventions summary (from CLAUDE.md sections 3-5)
3. Test command references (backend: `npm test`, frontend: `npx ng test --no-watch`)
4. Instruction: "Implement this story, write tests, verify all pass. Do not modify files outside your story scope."

### Review Protocol (after all subagents return)
1. Check each subagent's output for spec compliance (acceptance criteria met?)
2. Check for duplicate utilities or inconsistent patterns across subagents
3. Run FULL test suite (not just individual story tests) to catch integration issues
4. Only then pass to Critic for Gate 3 review
```

**Risk: MEDIUM-HIGH.** Powerful when stories are truly independent. Dangerous when they're not — and the "are they independent?" check is the hard part. Start with 2 parallel stories max before scaling up.

---

## Summary Matrix

| Skill | Benefit | Risk | Pipeline Conflict | Recommended? |
|-------|---------|------|-------------------|-------------|
| **Verification Before Completion** | Eliminates false "done" claims | LOW | None | **YES — add immediately** |
| **Systematic Debugging** | Prevents fix loops, saves tokens | LOW | None | **YES — add immediately** |
| **TDD (Red-Green-Refactor)** | Meaningful tests, early design feedback | MEDIUM | Changes Dev→QA ordering for services | **YES — as opt-in skill, not global rule** |
| **Git Worktree Isolation** | Filesystem safety for parallel work | MEDIUM | Hooks need path adjustment | **LATER — when you need parallel sprints** |
| **Parallel Subagent Dispatch** | Faster sprint completion | MEDIUM-HIGH | Must verify file independence | **LATER — after worktree is stable** |

## Recommended Rollout Order

1. **Week 1:** Add Verification Protocol + Debugging Protocol to `dev-lead.md` (zero risk, immediate value)
2. **Week 2:** Create `tdd-implementation.md` skill, use it on 1-2 backend service stories to calibrate (test the process)
3. **Week 3+:** If doing multi-story sprints, add worktree skill and try 2-story parallel dispatch on stories with zero file overlap
