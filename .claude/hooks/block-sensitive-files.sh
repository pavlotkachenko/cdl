#!/usr/bin/env bash
# block-sensitive-files.sh — PreToolUse hook for Edit/Write
# Blocks writes to sensitive files: .env, lock files, schema reference, node_modules, .git
#
# Input: JSON on stdin with tool_input.file_path
# Output: JSON with hookSpecificOutput.permissionDecision

set -euo pipefail

# Read JSON input from stdin
INPUT=$(cat)

# Extract file_path from tool_input
FILE_PATH=$(echo "$INPUT" | grep -oE '"file_path"\s*:\s*"[^"]*"' | head -1 | sed 's/.*: *"//;s/"$//')

if [[ -z "$FILE_PATH" ]]; then
  # No file_path found — allow
  exit 0
fi

# Normalize: get just the filename and check patterns
BASENAME=$(basename "$FILE_PATH")
REASON=""

# Check .env files
if [[ "$BASENAME" == ".env" || "$BASENAME" == .env.* ]]; then
  REASON="Blocked: .env files contain secrets and must not be modified by automation. Edit manually."
fi

# Check lock files
if [[ "$BASENAME" == "package-lock.json" || "$BASENAME" == "yarn.lock" || "$BASENAME" == "pnpm-lock.yaml" ]]; then
  REASON="Blocked: Lock files should only be modified by package managers (npm install), not direct writes."
fi

# Check schema reference
if [[ "$BASENAME" == "supabase_schema.sql" ]]; then
  REASON="Blocked: supabase_schema.sql is a reference file. Create a migration in supabase/migrations/ instead."
fi

# Check node_modules
if echo "$FILE_PATH" | grep -q 'node_modules/'; then
  REASON="Blocked: Never write to node_modules/. Use npm install to manage dependencies."
fi

# Check .git directory
if echo "$FILE_PATH" | grep -q '\.git/'; then
  REASON="Blocked: Never write directly to .git/. Use git commands instead."
fi

if [[ -n "$REASON" ]]; then
  # Deny with reason — exit code 2 blocks the tool call
  echo "$REASON"
  exit 2
fi

# File is not sensitive — allow (exit 0 = allow)
exit 0
