# Claude Code Operating Manual — CDL Ticket Management

> This file is the single source of truth for how to work with Claude Code on this project.
> Read automatically by Claude Code when opened from the project root.

---

## Session Start Checklist

When starting a new session, Claude should:
1. Read `CLAUDE.md` (project constitution — auto-loaded)
2. Read memory files: `~/.claude/projects/.../memory/MEMORY.md` (auto-loaded, links to topic files)
3. Check `sprints/` for current sprint state
4. Run `git status` to understand current branch and uncommitted work

---

## How to Request Features

### New feature (use PM decomposition)
```
As the product-manager, decompose "<feature name>" into implementable stories
```
Claude (as PM) will: read docs/, trace to requirements, break into 3-5 stories, present for approval.
**You approve before any code is written.**

### Bug fix (skip PM)
```
Fix <bug description>
```
Or reference the bug registry:
```
Fix BUG-004 from docs/HARD_BUGS_REGISTRY.md
```

### Code review
```
As the critic, review <file or feature> for security, DRY, and performance
```

### UX review
```
As the ux-expert, review <screen> for mobile usability and 3-click compliance
```

---

## Sprint Workflow (mandatory)

**Every sprint follows this sequence — no exceptions:**

```
1. PM decomposes → you approve stories
2. Create sprints/sprint_XXX/ folder with all story files  ← do this FIRST
3. Architect designs schema/API (for new data or endpoints)
4. UX Expert reviews mobile layout (for any UI changes)
5. Dev Lead implements (backend first, then frontend)
6. QA Tester writes tests
7. Critic reviews (security, DRY, performance, accessibility)
8. DevOps creates PR → you approve and merge         ← Claude must do this, not the user
```

### Step 8 — DevOps (PR creation) — Claude must do this proactively

At sprint end, after all tests pass, Claude creates the PR without waiting to be asked:

```bash
# 1. Verify tests
cd frontend && npx ng test --no-watch
cd backend && npm test

# 2. Stage changed files (never git add -A)
git add <specific files only>

# 3. Commit with conventional message
git commit -m "feat: <description>

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"

# 4. Push
git push -u origin $(git branch --show-current)

# 5. Create PR via gh CLI
gh pr create --title "..." --body "..."

# 6. Post PR URL to user and STOP — Gate 4 requires human approval before merge
```

The DevOps agent definition lives at `.claude/agents/devops.md` and can be invoked via the `Agent` tool for complex git scenarios.

Sprint folder structure:
```
sprints/sprint_XXX/
├── story-sprint-overview.md   ← sprint goal + story table + DoD
├── story-<ID>-<slug>.md       ← one per story
└── story-<ID>-tests.md        ← all test cases
```

See `memory/sprint-conventions.md` for templates.

---

## Memory Files (Claude's Persistent Context)

| File | Contents |
|---|---|
| `~/.claude/projects/.../memory/MEMORY.md` | Current state, key architecture summary, key files |
| `~/.claude/projects/.../memory/testing-patterns.md` | All Vitest/Jest patterns, mock setups, gotchas |
| `~/.claude/projects/.../memory/architecture.md` | Full file map, DB conventions, service/route table |
| `~/.claude/projects/.../memory/sprint-conventions.md` | Sprint folder format, story templates, completed sprint log |

Claude reads topic files with the `Read` tool when deeper context is needed for a specific area.

---

## Quality Gates (summary — full spec in CLAUDE.md §2)

| Gate | Description | Blocker? |
|---|---|---|
| 1. Architecture | Feature traces to docs/, follows patterns | Yes |
| 2. Test Coverage | Every modified file has a test file | Yes |
| 3. Critic Review | Security, DRY, performance, accessibility | Yes |
| 4. Human Approval | Destructive ops, deployments, financial logic | Yes — never automate |

**Gate 4 actions requiring explicit approval:**
- `git push`, PR merge, any production deployment
- `DROP TABLE`, schema migrations, bulk data changes
- Payment logic changes, RLS policy changes
- Force push, branch deletion

---

## Test Commands

```bash
# Frontend (Vitest via Angular)
cd frontend && npx ng test --no-watch

# Backend (Jest)
cd backend && npm test

# Single backend suite
cd backend && npx jest <name> --no-coverage

# E2E
cd frontend && npm run cy:run
```

**Expected baselines (update after each sprint):**
- Frontend: 448/449 pass (1 pre-existing socket.service failure — do not fix)
- Backend: 173/176 pass (5 pre-existing suite failures due to missing ENV vars — do not fix)

---

## Common Commands

### Check project status
```
Run all tests and report results
```

### Start a sprint
```
Let's start Sprint 021. As the product-manager, decompose <feature> into stories.
```

### Continue in-progress work
```
Continue Sprint XXX — we were implementing story <ID>
```
Claude will read the sprint folder and resume.

### Ship completed work
```
Create a PR for this sprint's work
```

---

## Key Files Quick Reference

| What | Where |
|---|---|
| Project constitution | `CLAUDE.md` |
| Backend conventions | `backend/CLAUDE.md` |
| Frontend conventions | `frontend/.claude/CLAUDE.md` |
| DB schema | `supabase_schema.sql` |
| API spec | `docs/API_SPECIFICATION.md` |
| Roadmap | `docs/07_ROADMAP_AND_PRIORITIES.md` |
| Bug registry | `docs/HARD_BUGS_REGISTRY.md` |
| Sprint folders | `sprints/sprint_XXX/` |

---

## Agent Model Budget

| Agent | Model | When to invoke |
|---|---|---|
| Product Manager | sonnet | New features, requirement decomposition |
| Architect | opus | Schema design, API contracts, system design |
| UX Expert | sonnet | Any UI changes — mobile layout, accessibility |
| Dev Lead | sonnet | Implementation (backend + frontend) |
| Critic | sonnet | Security review, pre-PR audit |
| QA Tester | haiku | Test generation |
| DevOps | haiku | Branching, committing, PRs |

---

## Angular 21 Quick Rules

- No `standalone: true` (it's the default — omit it)
- `inject()` not constructor injection
- `signal()`, `computed()` for state
- `@if`/`@for` not `*ngIf`/`*ngFor`
- `OnPush` always
- `input()`/`output()` not `@Input()`/`@Output()`
- Reactive forms (FormBuilder) not template-driven
- No `ngClass`/`ngStyle` — use `[class]`/`[style]` bindings

## Backend Quick Rules

- Controllers thin — logic in services
- Error shape: `{ error: { code, message } }`
- `supabaseAnon` for auth only, `supabase` for all DB queries
- bcrypt 10 rounds, JWT 7-day expiry with `role` claim
- RLS on every table
- Non-blocking emails: `.catch(err => console.error(...))`
