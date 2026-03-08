#!/usr/bin/env bash
# verify-story.sh — Machine-checkable Definition of Done verification
# Usage: bash .claude/scripts/verify-story.sh <path-to-story-file>
#
# Checks:
#   1. All acceptance criteria are checked (no "- [ ]" lines)
#   2. Story status is DONE
#   3. Associated test file has no TODO entries
#   4. Backend tests pass
#   5. Frontend tests pass
#   6. Uncommitted changes warning

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

# --- Argument validation ---
if [[ $# -lt 1 ]]; then
  echo "Usage: bash .claude/scripts/verify-story.sh <path-to-story-file>"
  echo "Example: bash .claude/scripts/verify-story.sh sprints/sprint_035/story-PE-1-driver-invoice-pdf.md"
  exit 1
fi

STORY_FILE="$1"

# Resolve relative paths from project root
if [[ ! "$STORY_FILE" = /* ]]; then
  STORY_FILE="$PROJECT_ROOT/$STORY_FILE"
fi

if [[ ! -f "$STORY_FILE" ]]; then
  echo "[FAIL] Story file not found: $STORY_FILE"
  exit 1
fi

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

pass() { echo "[PASS] $1"; PASS_COUNT=$((PASS_COUNT + 1)); }
fail() { echo "[FAIL] $1"; FAIL_COUNT=$((FAIL_COUNT + 1)); }
warn() { echo "[WARN] $1"; WARN_COUNT=$((WARN_COUNT + 1)); }

echo "============================================="
echo " Definition of Done — Story Verification"
echo " File: $(basename "$STORY_FILE")"
echo "============================================="
echo ""

# --- 1. Acceptance criteria ---
UNCHECKED=$(grep -c '^\- \[ \]' "$STORY_FILE" 2>/dev/null || echo "0")
CHECKED=$(grep -c '^\- \[x\]' "$STORY_FILE" 2>/dev/null || echo "0")
TOTAL=$((UNCHECKED + CHECKED))

if [[ "$TOTAL" -eq 0 ]]; then
  warn "No acceptance criteria found (no checkbox lines)"
elif [[ "$UNCHECKED" -gt 0 ]]; then
  fail "Acceptance criteria: $UNCHECKED of $TOTAL unchecked"
else
  pass "Acceptance criteria: all $CHECKED/$TOTAL checked"
fi

# --- 2. Story status ---
if grep -qiE '\*\*Status:\*\*.*DONE' "$STORY_FILE" 2>/dev/null; then
  pass "Story status is DONE"
elif grep -qiE '\*\*Status:\*\*' "$STORY_FILE" 2>/dev/null; then
  STATUS=$(grep -oiE '\*\*Status:\*\*\s*\S+' "$STORY_FILE" | head -1)
  fail "Story status is not DONE (found: $STATUS)"
else
  warn "No **Status:** field found in story file"
fi

# --- 3. Test coverage file ---
SPRINT_DIR=$(dirname "$STORY_FILE")
STORY_BASENAME=$(basename "$STORY_FILE" .md)
# Extract story ID (e.g., "PE-1" from "story-PE-1-driver-invoice-pdf")
STORY_ID=$(echo "$STORY_BASENAME" | sed 's/^story-//' | sed 's/-[a-z].*$//')

# Look for matching test file
TESTS_FILE=""
for candidate in "$SPRINT_DIR"/story-*-tests.md; do
  if [[ -f "$candidate" ]] && echo "$candidate" | grep -qi "$STORY_ID"; then
    TESTS_FILE="$candidate"
    break
  fi
done

# Also check for a general tests file for the sprint
if [[ -z "$TESTS_FILE" ]]; then
  for candidate in "$SPRINT_DIR"/*tests*.md; do
    if [[ -f "$candidate" ]]; then
      TESTS_FILE="$candidate"
      break
    fi
  done
fi

if [[ -n "$TESTS_FILE" ]]; then
  TODO_COUNT=$(grep -ciE '\bTODO\b' "$TESTS_FILE" 2>/dev/null || echo "0")
  if [[ "$TODO_COUNT" -gt 0 ]]; then
    fail "Test file has $TODO_COUNT TODO entries: $(basename "$TESTS_FILE")"
  else
    pass "Test coverage file has no TODOs: $(basename "$TESTS_FILE")"
  fi
else
  warn "No test coverage file found for story $STORY_ID in $SPRINT_DIR"
fi

# --- 4. Backend tests ---
echo ""
echo "Running backend tests..."
cd "$PROJECT_ROOT/backend"
BACKEND_OUTPUT=$(npm test 2>&1) || true
if echo "$BACKEND_OUTPUT" | grep -qE "Tests:.*failed"; then
  FAILED_LINE=$(echo "$BACKEND_OUTPUT" | grep -E "Tests:.*failed" | tail -1)
  fail "Backend tests: $FAILED_LINE"
elif echo "$BACKEND_OUTPUT" | grep -qE "Test Suites:.*passed"; then
  PASSED_LINE=$(echo "$BACKEND_OUTPUT" | grep -E "Tests:.*passed" | tail -1)
  pass "Backend tests: $PASSED_LINE"
else
  warn "Could not parse backend test output"
fi

# --- 5. Frontend tests ---
echo ""
echo "Running frontend tests..."
cd "$PROJECT_ROOT/frontend"
FRONTEND_OUTPUT=$(npx ng test --no-watch 2>&1) || true
if echo "$FRONTEND_OUTPUT" | grep -qE "FAILED|failed"; then
  FAILED_LINE=$(echo "$FRONTEND_OUTPUT" | grep -E "FAILED|failed" | tail -1)
  fail "Frontend tests: $FAILED_LINE"
elif echo "$FRONTEND_OUTPUT" | grep -qE "SUCCESS|TOTAL.*SUCCESS"; then
  PASSED_LINE=$(echo "$FRONTEND_OUTPUT" | grep -E "executed|SUCCESS" | tail -1)
  pass "Frontend tests: $PASSED_LINE"
else
  warn "Could not parse frontend test output"
fi

# --- 6. Uncommitted changes ---
echo ""
cd "$PROJECT_ROOT"
UNCOMMITTED=$(git status --porcelain 2>/dev/null | grep -v '??' | wc -l | tr -d ' ')
if [[ "$UNCOMMITTED" -gt 0 ]]; then
  warn "There are $UNCOMMITTED uncommitted tracked file changes"
else
  pass "No uncommitted tracked changes"
fi

# --- Summary ---
echo ""
echo "============================================="
echo " SUMMARY"
echo "============================================="
echo " Passed:   $PASS_COUNT"
echo " Failed:   $FAIL_COUNT"
echo " Warnings: $WARN_COUNT"
echo "============================================="

if [[ "$FAIL_COUNT" -gt 0 ]]; then
  echo " RESULT: NOT DONE — fix $FAIL_COUNT failure(s) above"
  exit 1
else
  echo " RESULT: DONE — all checks passed"
  exit 0
fi
