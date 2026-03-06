#!/usr/bin/env bash
# Install project git hooks.
# Run from the repo root: bash scripts/install-hooks.sh

set -e

HOOKS_DIR=".git/hooks"
SOURCE_DIR="scripts/hooks"

if [ ! -d "$HOOKS_DIR" ]; then
  echo "Error: $HOOKS_DIR not found. Run from the repo root."
  exit 1
fi

for hook in "$SOURCE_DIR"/*; do
  name=$(basename "$hook")
  dest="$HOOKS_DIR/$name"
  cp "$hook" "$dest"
  chmod +x "$dest"
  echo "✅  Installed $dest"
done

echo ""
echo "All hooks installed."
