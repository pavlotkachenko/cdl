# Skill: PR Workflow

Branch creation, commit, push, and pull request creation with quality gates. This replaces the CrewAI DevOps agent's `task_git_push` task with `human_input=True`.

## Trigger

Use when:
- "Ship this" / "Create a PR"
- "Commit and push"
- After all quality gates pass for a feature
- Step 7 of the implement-feature pipeline

## Prerequisites

Before creating a PR, ALL of these must be true:
- [ ] Code compiles: `cd frontend && ng build` succeeds
- [ ] Backend tests pass: `cd backend && npm test`
- [ ] Frontend tests pass: `cd frontend && npx ng test --no-watch`
- [ ] Critic review completed with APPROVED verdict

If any prerequisite fails, **STOP** and fix the issue first.

## Workflow

### Step 1: Verify Clean State

```bash
# Check current branch and status
git status
git branch --show-current
```

If on `main`, create a feature branch first. Never commit directly to `main`.

### Step 2: Create Branch (if needed)

```bash
# Branch naming convention:
# feat/<feature-name>  — new features
# fix/<bug-id-or-desc> — bug fixes
# refactor/<scope>     — refactoring
# test/<scope>         — test additions
git checkout -b feat/feature-name
```

### Step 3: Stage Files

Stage only files related to this change. **NEVER use `git add -A` or `git add .`**

```bash
# Review what changed
git diff --stat
git status

# Stage specific files
git add path/to/file1
git add path/to/file2
```

**Do NOT stage:**
- `.env` files
- `node_modules/`
- Build artifacts (`dist/`, `.angular/`)
- IDE files (`.idea/`, `.vscode/`)

### Step 4: Commit

Use conventional commit format:

```bash
git commit -m "feat: concise description of what and why

- Bullet point details of key changes
- Another detail

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Step 5: Push

```bash
git push -u origin $(git branch --show-current)
```

### Step 6: Create PR

```bash
gh pr create \
  --title "feat: Short descriptive title" \
  --body "## Summary
Brief description of what this PR does and why.

## Changes
- Change 1
- Change 2
- Change 3

## Quality Gates
- [x] Gate 1: Architecture aligns with docs
- [x] Gate 2: Tests pass (Jest + Angular + Cypress)
- [x] Gate 3: Critic review — APPROVED
- [ ] Gate 4: Human approval — PENDING

## Test Plan
- [ ] Manual test step 1
- [ ] Manual test step 2

## Screenshots (if UI change)
<!-- Add screenshots for visual changes -->
"
```

### Step 7: Human Approval (Gate 4)

**STOP HERE and notify the user.** Provide:
1. The PR URL
2. Summary of changes
3. Test results
4. Critic review verdict

The user must explicitly approve before merge.

## Rules

- NEVER force-push to any shared branch
- NEVER merge without human approval
- NEVER commit secrets or environment files
- ALWAYS use conventional commit messages
- ALWAYS include quality gates checklist in PR body
- If pre-commit hooks fail, fix the issue and create a NEW commit (never amend)
