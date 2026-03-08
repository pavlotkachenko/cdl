#!/usr/bin/env bash
# verify-before-stop.sh — Pre-completion verification hook
# Triggered on Stop event. Checks sprint story completion and test health.
# Uses a guard file to prevent infinite loops (runs once per session).
#
# Input: JSON on stdin (consumed but not used)
# Output: stderr messages for Claude visibility + exit code 2 to block, 0 to allow
#
# NOTE: No `set -euo pipefail` — commands may fail (missing dirs, test failures)
# and we handle each case explicitly.

# Consume stdin
cat > /dev/null 2>/dev/null || true

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

# --- Infinite-loop guard ---
# The Stop hook fires every time Claude tries to finish. Without a guard,
# a failing check would block Claude forever. We allow ONE verification
# pass; if it fails, Claude sees the message and can act, but subsequent
# Stop attempts pass through.
GUARD="/tmp/cdl-stop-hook-active"
if [[ -f "$GUARD" ]]; then
  echo "Stop hook: skipping (already ran this session)" >&2
  exit 0
fi
touch "$GUARD"

FAILURES=""

# --- 1. Check for active sprint stories with unchecked acceptance criteria ---
if [[ -d "$PROJECT_ROOT/sprints" ]]; then
  LATEST_SPRINT_DIR=$(find "$PROJECT_ROOT/sprints" -maxdepth 1 -type d -name 'sprint_*' 2>/dev/null | sort | tail -1)

  if [[ -n "$LATEST_SPRINT_DIR" ]]; then
    UNCHECKED_STORIES=""
    for story_file in "$LATEST_SPRINT_DIR"/story-*.md; do
      [[ -f "$story_file" ]] || continue
      # Skip test and overview files
      case "$(basename "$story_file")" in
        *tests*|*overview*) continue ;;
      esac
      if grep -q '^- \[ \]' "$story_file" 2>/dev/null; then
        UNCHECKED_STORIES="${UNCHECKED_STORIES}  - $(basename "$story_file")\n"
      fi
    done

    if [[ -n "$UNCHECKED_STORIES" ]]; then
      FAILURES="${FAILURES}[WARN] Unchecked acceptance criteria in $(basename "$LATEST_SPRINT_DIR"):\n${UNCHECKED_STORIES}"
    fi
  fi
fi

# --- 2. Run backend tests ---
if [[ -d "$PROJECT_ROOT/backend" ]]; then
  echo "Stop hook: running backend tests..." >&2
  BACKEND_OUTPUT=$(cd "$PROJECT_ROOT/backend" && npm test 2>&1) || true
  if echo "$BACKEND_OUTPUT" | grep -qE "Tests:.*failed"; then
    BACKEND_RESULT=$(echo "$BACKEND_OUTPUT" | grep -E "Tests:" | tail -1)
    FAILURES="${FAILURES}[FAIL] Backend: ${BACKEND_RESULT}\n"
  elif echo "$BACKEND_OUTPUT" | grep -qE "Tests:.*passed"; then
    echo "Stop hook: backend tests passed" >&2
  fi
fi

# --- 3. Run frontend tests ---
if [[ -d "$PROJECT_ROOT/frontend" ]]; then
  echo "Stop hook: running frontend tests..." >&2
  FRONTEND_OUTPUT=$(cd "$PROJECT_ROOT/frontend" && npx ng test --no-watch 2>&1) || true
  if echo "$FRONTEND_OUTPUT" | grep -qE "FAILED"; then
    FRONTEND_RESULT=$(echo "$FRONTEND_OUTPUT" | grep -E "FAILED|executed" | tail -1)
    FAILURES="${FAILURES}[FAIL] Frontend: ${FRONTEND_RESULT}\n"
  elif echo "$FRONTEND_OUTPUT" | grep -qE "SUCCESS"; then
    echo "Stop hook: frontend tests passed" >&2
  fi
fi

# --- 4. Report results ---
if [[ -n "$FAILURES" ]]; then
  {
    echo ""
    echo "========================================="
    echo " STOP HOOK: Verification failures found"
    echo "========================================="
    echo -e "$FAILURES"
    echo "Please fix the issues above before finishing."
    echo "The hook will not block again this session."
  } >&2
  exit 2
fi

echo "Stop hook: all checks passed" >&2
exit 0
