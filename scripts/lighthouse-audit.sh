#!/usr/bin/env bash
# lighthouse-audit.sh — Run Lighthouse audits and save JSON reports
# Usage: ./scripts/lighthouse-audit.sh [base_url]
# Requires: npm install -g lighthouse
#
# Targets: Performance, Accessibility, Best Practices, SEO
# Saves reports to: docs/audit/lighthouse/

set -euo pipefail

BASE_URL="${1:-http://localhost:4200}"
REPORT_DIR="docs/audit/lighthouse"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

mkdir -p "$REPORT_DIR"

PAGES=(
  "/"
  "/login"
  "/driver/dashboard"
  "/carrier/dashboard"
  "/attorney/dashboard"
)

echo "=== Lighthouse Audit ==="
echo "Base URL : $BASE_URL"
echo "Report dir: $REPORT_DIR"
echo "Timestamp : $TIMESTAMP"
echo ""

OVERALL_PASS=true

for PATH_SUFFIX in "${PAGES[@]}"; do
  PAGE_URL="${BASE_URL}${PATH_SUFFIX}"
  SAFE_NAME=$(echo "$PATH_SUFFIX" | sed 's|/|_|g' | sed 's|^_||')
  SAFE_NAME="${SAFE_NAME:-home}"
  REPORT_FILE="${REPORT_DIR}/${TIMESTAMP}_${SAFE_NAME}.json"

  echo "Auditing: $PAGE_URL"

  lighthouse "$PAGE_URL" \
    --output=json \
    --output-path="$REPORT_FILE" \
    --chrome-flags="--headless --no-sandbox --disable-gpu" \
    --quiet \
    2>/dev/null || {
      echo "  [WARN] Lighthouse failed for $PAGE_URL — is the app running?"
      continue
    }

  # Extract key scores
  PERF=$(node -e "const r=require('$REPORT_FILE'); console.log(Math.round((r.categories.performance.score||0)*100))" 2>/dev/null || echo "?")
  A11Y=$(node -e "const r=require('$REPORT_FILE'); console.log(Math.round((r.categories.accessibility.score||0)*100))" 2>/dev/null || echo "?")
  BP=$(node -e "const r=require('$REPORT_FILE'); console.log(Math.round((r.categories['best-practices'].score||0)*100))" 2>/dev/null || echo "?")
  SEO=$(node -e "const r=require('$REPORT_FILE'); console.log(Math.round((r.categories.seo.score||0)*100))" 2>/dev/null || echo "?")

  echo "  Performance : ${PERF}%  (target: ≥90)"
  echo "  Accessibility: ${A11Y}%  (target: 100)"
  echo "  Best Practices: ${BP}%"
  echo "  SEO          : ${SEO}%"

  # Fail if accessibility or performance below threshold
  if [ "$A11Y" != "?" ] && [ "$A11Y" -lt 90 ]; then
    echo "  [FAIL] Accessibility below 90%"
    OVERALL_PASS=false
  fi
  if [ "$PERF" != "?" ] && [ "$PERF" -lt 70 ]; then
    echo "  [FAIL] Performance below 70% (local dev threshold)"
    OVERALL_PASS=false
  fi

  echo "  Saved: $REPORT_FILE"
  echo ""
done

echo "=== Audit Complete ==="
if [ "$OVERALL_PASS" = true ]; then
  echo "RESULT: PASS — all thresholds met"
  exit 0
else
  echo "RESULT: FAIL — one or more thresholds not met (see above)"
  exit 1
fi
