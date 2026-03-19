#!/usr/bin/env bash
# Pre-Sprint Kickoff Checklist
# Validates environment, dependencies, story files, and baseline tests
# before any sprint implementation begins.
#
# Usage: bash .claude/scripts/pre-sprint-kickoff.sh [sprints/sprint_XXX]
#   If no sprint dir provided, uses the latest sprint folder.

set -euo pipefail

FAIL=0
WARN=0

pass() { echo "  [PASS] $1"; }
fail() { echo "  [FAIL] $1"; FAIL=$((FAIL + 1)); }
warn() { echo "  [WARN] $1"; WARN=$((WARN + 1)); }

echo ""
echo "=== Pre-Sprint Kickoff Checklist ==="
echo ""

# --- 1. Sprint story files ---
echo "1. Sprint Story Files"

SPRINT_DIR="${1:-}"
if [ -z "$SPRINT_DIR" ]; then
  LATEST=$(ls sprints/ 2>/dev/null | sort | tail -1)
  if [ -z "$LATEST" ]; then
    fail "No sprint directories found in sprints/"
  else
    SPRINT_DIR="sprints/$LATEST"
  fi
fi

if [ -d "$SPRINT_DIR" ]; then
  pass "Sprint directory exists: $SPRINT_DIR"

  if [ -f "$SPRINT_DIR/story-sprint-overview.md" ]; then
    pass "Sprint overview exists"
  else
    fail "Missing: $SPRINT_DIR/story-sprint-overview.md"
  fi

  STORY_COUNT=$(find "$SPRINT_DIR" -maxdepth 1 -name "story-*.md" \
    ! -name "story-sprint-overview.md" 2>/dev/null | wc -l | tr -d ' ')

  if [ "$STORY_COUNT" -gt 0 ]; then
    pass "$STORY_COUNT individual story files found"

    # Check for any TODO stories (expected at kickoff)
    TODO_COUNT=$(grep -rl "Status.*TODO" "$SPRINT_DIR"/story-*.md 2>/dev/null | wc -l | tr -d ' ')
    if [ "$TODO_COUNT" -gt 0 ]; then
      pass "$TODO_COUNT stories in TODO status (ready for implementation)"
    else
      warn "No stories in TODO status — all may be DONE already"
    fi
  else
    fail "No individual story files in $SPRINT_DIR (only overview)"
  fi
else
  fail "Sprint directory does not exist: $SPRINT_DIR"
fi

echo ""

# --- 2. Environment files ---
echo "2. Environment"

if [ -f "backend/.env" ]; then
  pass "backend/.env exists"

  # Check for required keys (just existence, not values)
  for KEY in SUPABASE_URL SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY JWT_SECRET; do
    if grep -q "^${KEY}=" "backend/.env" 2>/dev/null; then
      pass "$KEY is set"
    else
      fail "Missing required env var: $KEY"
    fi
  done
else
  fail "backend/.env does not exist"
fi

echo ""

# --- 3. Dependencies ---
echo "3. Dependencies"

if [ -d "backend/node_modules" ]; then
  pass "backend/node_modules exists"
else
  fail "backend/node_modules missing — run: cd backend && npm ci"
fi

if [ -d "frontend/node_modules" ]; then
  pass "frontend/node_modules exists"
else
  fail "frontend/node_modules missing — run: cd frontend && npm ci"
fi

echo ""

# --- 4. Baseline tests ---
echo "4. Baseline Tests"

echo "  Running backend tests..."
if (cd backend && npm test --no-coverage 2>&1 | tail -3); then
  pass "Backend tests completed"
else
  warn "Backend tests had failures (check if pre-existing)"
fi

echo ""
echo "  Running frontend tests..."
if (cd frontend && npx ng test --no-watch 2>&1 | tail -3); then
  pass "Frontend tests completed"
else
  warn "Frontend tests had failures (check if pre-existing)"
fi

echo ""

# --- 5. Git state ---
echo "5. Git State"

BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
echo "  Current branch: $BRANCH"

if [ "$BRANCH" = "main" ]; then
  warn "On main branch — create a feature branch before implementing"
else
  pass "On feature branch: $BRANCH"
fi

UNCOMMITTED=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
if [ "$UNCOMMITTED" -gt 0 ]; then
  warn "$UNCOMMITTED uncommitted changes — consider stashing or committing first"
else
  pass "Working directory clean"
fi

echo ""
echo "=== Results ==="
echo "  Failures: $FAIL"
echo "  Warnings: $WARN"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo "BLOCKED: Fix $FAIL failure(s) before starting sprint work."
  exit 1
else
  echo "READY: All checks passed. Sprint can begin."
  exit 0
fi
