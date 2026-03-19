# Claude Setup Improvement Proposals

> Items not yet implemented. Each includes impact, pros/cons, and proposed implementation.

---

## 1. Consolidate Duplicated Conventions

**Current state:** Code conventions appear in 3 places:
- Root `CLAUDE.md` Section 4 (~80 lines of frontend + backend + database rules)
- `frontend/.claude/CLAUDE.md` (57 lines, frontend-specific)
- `backend/CLAUDE.md` (175 lines, backend-specific)

When one changes, the others drift silently.

**Proposed fix:** Root `CLAUDE.md` Section 4 becomes a summary with links.

```markdown
## 4. Code Conventions

### Frontend (Angular 21)
See `frontend/.claude/CLAUDE.md` for the authoritative source. Key rules: [3-4 bullet summary].

### Backend (Node.js / Express 5)
See `backend/CLAUDE.md` for the authoritative source. Key rules: [3-4 bullet summary].

### Database (Supabase / PostgreSQL)
[Keep in root — no subdirectory file for database conventions]
```

**Impact:** MEDIUM — prevents convention drift, reduces root CLAUDE.md by ~50 lines.

**Pros:**
- Single source of truth per domain (frontend conventions live in frontend/)
- Reduces root CLAUDE.md length → less context consumed per session
- Changes to frontend conventions don't require touching root CLAUDE.md

**Cons:**
- Agents that read only root CLAUDE.md will miss detailed conventions (must follow the link)
- Two reads instead of one to get full picture
- If subdirectory CLAUDE.md files are ever deleted, root loses its detailed conventions

**Recommendation:** Implement. The risk of drift (3 files going out of sync) is worse than the cost of an extra file read. Keep database conventions in root since there's no `database/` subdirectory.

---

## 2. Pre-Sprint Kickoff Checklist

**Current state:** No validation runs before sprint work begins. If .env is missing, deps aren't installed, or baseline tests fail, you discover it mid-implementation after burning tokens.

**Proposed fix:** Create `.claude/scripts/pre-sprint-kickoff.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "=== Pre-Sprint Kickoff Checklist ==="

# 1. Sprint story files exist
SPRINT_DIR="$1"
if [ -z "$SPRINT_DIR" ]; then
  SPRINT_DIR=$(ls sprints/ | sort | tail -1)
  SPRINT_DIR="sprints/$SPRINT_DIR"
fi

echo "Checking sprint: $SPRINT_DIR"

if [ ! -d "$SPRINT_DIR" ]; then
  echo "FAIL: Sprint directory does not exist: $SPRINT_DIR"
  exit 1
fi

STORY_COUNT=$(ls "$SPRINT_DIR"/story-[A-Z]*.md 2>/dev/null | wc -l)
if [ "$STORY_COUNT" -eq 0 ]; then
  echo "FAIL: No individual story files in $SPRINT_DIR (only overview?)"
  exit 1
fi
echo "OK: $STORY_COUNT story files found"

# 2. Environment files
if [ ! -f "backend/.env" ]; then
  echo "FAIL: backend/.env does not exist"
  exit 1
fi
echo "OK: backend/.env exists"

# 3. Dependencies installed
if [ ! -d "backend/node_modules" ]; then
  echo "FAIL: backend/node_modules missing. Run: cd backend && npm ci"
  exit 1
fi
if [ ! -d "frontend/node_modules" ]; then
  echo "FAIL: frontend/node_modules missing. Run: cd frontend && npm ci"
  exit 1
fi
echo "OK: Dependencies installed"

# 4. Baseline tests pass
echo "Running backend tests..."
(cd backend && npm test --no-coverage) || {
  echo "FAIL: Backend baseline tests failing"
  exit 1
}

echo "Running frontend tests..."
(cd frontend && npx ng test --no-watch) || {
  echo "FAIL: Frontend baseline tests failing"
  exit 1
}

echo ""
echo "=== All checks passed. Ready to start sprint. ==="
```

**Usage:** `bash .claude/scripts/pre-sprint-kickoff.sh [sprints/sprint_XXX]`

**Impact:** MEDIUM — catches setup issues before they waste implementation tokens.

**Pros:**
- Fails fast on missing deps, env, or broken baseline
- Can be added to implement-feature Step 1 as a prerequisite
- Takes ~2 minutes to run, saves potentially 30+ minutes of debugging

**Cons:**
- Adds ~2 minutes to every sprint start (test suite execution)
- Backend has 3 pre-existing test failures — script needs to tolerate known failures or it'll always block
- Another script to maintain

**Recommendation:** Implement, but use `npm test 2>&1 | tail -5` to show results without blocking on pre-existing failures. Or add `--passWithNoTests` and check exit code.

---

## 3. Sprint Story/Test File Templates

**Current state:** Story files follow a pattern (visible in `sprints/sprint_035/` through `sprint_059/`) but there's no template file. Each decompose-requirement run reinvents the format.

**Proposed fix:** Already created: `.claude/templates/sprint-story-template.md`

Also create `.claude/templates/sprint-overview-template.md`:

```markdown
# Sprint XXX — [Theme]

**Goal:** [1-2 sentence sprint goal]
**Branch:** `feat/sprint-XXX-[theme]`

## Stories

| # | ID | Title | Priority | Status | Depends On |
|---|-----|-------|----------|--------|------------|
| 1 | PREFIX-1 | [title] | P0 | TODO | none |
| 2 | PREFIX-2 | [title] | P1 | TODO | PREFIX-1 |

## Definition of Done
- [ ] All story statuses are DONE
- [ ] All acceptance criteria checked
- [ ] Backend tests pass: `cd backend && npm test`
- [ ] Frontend tests pass: `cd frontend && npx ng test --no-watch`
- [ ] No uncommitted changes
- [ ] PR created and reviewed

## Dependencies
- [External dependencies, API keys needed, etc.]
```

**Impact:** LOW-MEDIUM — consistency and speed improvement for decompose step.

**Pros:**
- Ensures every sprint has the same fields (prevents missing test coverage matrix)
- Speeds up decompose-requirement Step 7
- New team members can understand story format immediately

**Cons:**
- Template may need updating as the format evolves
- Marginal benefit — the agent already produces consistent stories from the decompose-requirement skill instructions

**Recommendation:** Implement. Already referenced in implement-feature.md Step 1. Low cost, prevents format drift.

---

## 4. Update Model Assignments

**Current state:** Agents reference models generically: "sonnet", "opus", "haiku". These resolve to whatever the current default is.

**Proposed fix:** Pin to specific model IDs:

| Agent | Current | Proposed | Rationale |
|-------|---------|----------|-----------|
| Product Mgr | sonnet | claude-sonnet-4-6 | Latest reasoning for req analysis |
| Architect | opus | claude-opus-4-6 | Strongest for system design |
| UX Expert | sonnet | claude-sonnet-4-6 | Design reasoning |
| Dev Lead | sonnet | claude-sonnet-4-6 | Code quality + speed |
| Critic | sonnet | claude-sonnet-4-6 | Security analysis depth |
| QA Tester | haiku | claude-haiku-4-5-20251001 | Cost-effective test gen |
| DevOps | haiku | claude-haiku-4-5-20251001 | Scripted workflows |
| Docs Writer | haiku | claude-haiku-4-5-20251001 | Template-based writing |

**Impact:** LOW — reproducibility improvement.

**Pros:**
- Reproducible behavior across sessions (no surprise model changes)
- Explicit cost control — you know exactly what you're paying per agent
- Can A/B test: try Sonnet 4.6 for QA Tester on one sprint, compare quality

**Cons:**
- Must manually update IDs when new models release
- "sonnet" auto-resolving to latest is often what you want
- If Claude Code stops supporting an old model ID, agents break until updated

**Recommendation:** Optional. The generic names ("sonnet", "haiku") auto-resolve to latest, which is usually desirable. Only pin if you need reproducibility for compliance or cost auditing. If you do pin, add a comment with the date so you know when to revisit.

---

## 5. Context Compaction Automation

**Current state:** CLAUDE.md Section 10 says "update `claude-progress.txt` on compaction" but there's no automated mechanism. If compaction happens mid-task, context is lost silently.

**Proposed fix:** The progress file approach is already the right pattern. The gap is that there's no reminder to write it *before* compaction hits. Options:

**Option A: Periodic progress checkpoint (recommended)**
Add to implement-feature.md between each major step:

```markdown
### Between Steps: Progress Checkpoint
After completing each pipeline step (Architecture, UX Review, Backend, Frontend, Tests, Review):
1. Update `claude-progress.txt` with current state
2. Note which step just completed and which is next
3. List any decisions made that aren't in the story file
```

**Option B: Hook-based (not currently possible)**
Claude Code doesn't have a "pre-compaction" hook event. This would require a feature request to Anthropic.

**Impact:** LOW — prevents context loss on long sessions.

**Pros:**
- Cheap insurance against context loss
- Makes session handoff cleaner (new session reads progress file)
- Forces documentation of in-flight decisions

**Cons:**
- Adds ~30 seconds of overhead per step
- Progress file can become stale if agent forgets to update it
- Only helps if the next session actually reads the file

**Recommendation:** Implement Option A. Add one line to each step in implement-feature.md: "Update `claude-progress.txt` before proceeding."

---

## 6. PreCommit Hook for Conventional Commits

**Current state:** `scripts/hooks/commit-msg` validates sprint gates (folder exists, story files exist) but doesn't validate conventional commit format (`feat:`, `fix:`, etc.).

**Proposed fix:** Add format validation to existing commit-msg hook:

```bash
# Add to scripts/hooks/commit-msg, before sprint gate checks

COMMIT_MSG=$(cat "$1")
PATTERN='^(feat|fix|refactor|test|docs|chore|style|perf|ci|build|revert)(\(.+\))?: .{1,72}'

if ! echo "$COMMIT_MSG" | grep -qE "$PATTERN"; then
  echo "ERROR: Commit message does not follow conventional commit format."
  echo "Expected: type(scope): description"
  echo "Types: feat, fix, refactor, test, docs, chore, style, perf, ci, build, revert"
  echo "Got: $COMMIT_MSG"
  exit 1
fi
```

**Impact:** LOW — catches typos in commit messages.

**Pros:**
- Enforces the convention already documented in CLAUDE.md Section 9
- Prevents "WIP", "fix stuff", "asdf" commits from reaching the remote
- Cheap to implement (5 lines added to existing hook)

**Cons:**
- Can be annoying during rapid iteration (must format every commit)
- Merge commits from GitHub don't follow this pattern (but those go through PR, not local commit)
- The agent already follows conventional commits — this mostly catches human commits

**Recommendation:** Implement. 5 lines, zero risk. Add to the existing `scripts/hooks/commit-msg`.

---

## 7. ADR (Architecture Decision Record) Workflow

**Current state:** `architect.md` lists "Architecture Decision Records" as a core responsibility but there's no template, no storage location, and no skill.

**Proposed fix:** Create `docs/adr/` directory with a template:

```
docs/adr/
├── 000-template.md
├── 001-supabase-over-raw-postgres.md
├── 002-angular-signals-over-rxjs-state.md
└── ...
```

Template (`docs/adr/000-template.md`):
```markdown
# ADR-XXX: [Decision Title]

**Date:** YYYY-MM-DD
**Status:** PROPOSED / ACCEPTED / DEPRECATED / SUPERSEDED by ADR-YYY
**Decider:** [who made the call]

## Context
[What is the issue? What forces are at play?]

## Decision
[What was decided]

## Consequences
### Positive
- [benefit]
### Negative
- [tradeoff]
### Risks
- [what could go wrong]
```

**Impact:** LOW — documentation improvement for future maintainability.

**Pros:**
- Captures *why* decisions were made (code shows *what*, ADRs show *why*)
- New team members can understand architectural choices without archeology
- Prevents re-litigating settled decisions

**Cons:**
- Another document to maintain
- Most useful for teams; solo developer gets less value
- Retroactively writing ADRs for past decisions is tedious

**Recommendation:** Create the template and directory. Write ADRs going forward for new decisions only — don't backfill. Add to Architect agent as: "For significant architectural decisions, create an ADR in `docs/adr/`."

---

## 8. Tighter Bash Permissions

**Current state:** `.claude/settings.local.json` uses `Bash(*)` wildcard — all bash commands auto-approved.

**Proposed fix:** Replace with explicit allowlist:

```json
{
  "permissions": {
    "allow": [
      "Bash(git *)",
      "Bash(npm *)",
      "Bash(npx *)",
      "Bash(ng *)",
      "Bash(node *)",
      "Bash(ls *)",
      "Bash(cat *)",
      "Bash(mkdir *)",
      "Bash(cp *)",
      "Bash(mv *)",
      "Bash(rm *.md)",
      "Bash(cd *)",
      "Bash(bash .claude/*)",
      "Bash(bash scripts/*)",
      "Edit(*)",
      "Write(*)",
      "Read(*)",
      "Glob(*)",
      "Grep(*)"
    ]
  }
}
```

**Impact:** LOW — security hardening.

**Pros:**
- Prevents accidental destructive commands (`rm -rf`, `curl | bash`, `chmod 777`)
- Defense in depth — hooks block file writes, permissions block dangerous commands
- Still allows all normal development operations

**Cons:**
- Will prompt for approval on any command not in the list (e.g., `python`, `docker`, `curl`)
- Must update allowlist when new tools are introduced
- The PreToolUse hook already blocks the most dangerous file operations
- Can slow down exploratory work if you need an unlisted command

**Recommendation:** Optional. The current wildcard + hook approach is pragmatic for a solo developer. Tighten if you add team members or if you've ever had a close call with a destructive command. The hooks are your primary safety net; permissions are secondary.

---

## Implementation Priority

| # | Item | Effort | Impact | Do It? |
|---|------|--------|--------|--------|
| 1 | Consolidate conventions | 30 min | Prevents drift | Yes |
| 2 | Pre-sprint kickoff script | 20 min | Catches setup issues | Yes |
| 3 | Story/overview templates | 10 min | Consistency | Done (story template created) |
| 4 | Model ID pinning | 15 min | Reproducibility | Optional |
| 5 | Compaction checkpoints | 10 min | Context preservation | Yes |
| 6 | Conventional commit hook | 5 min | Format enforcement | Yes |
| 7 | ADR template | 10 min | Decision documentation | Yes (template only) |
| 8 | Tighter permissions | 15 min | Security hardening | Optional |
