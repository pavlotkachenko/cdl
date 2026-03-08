#!/bin/sh
# ---------------------------------------------------------------------------
# Run Cypress E2E tests inside Docker (works on macOS 26 where Electron
# is incompatible with the host OS).
#
# Usage (from the repo root OR from frontend/):
#
#   # All specs:
#   ./frontend/docker-run-cypress.sh
#
#   # Specific spec group:
#   ./frontend/docker-run-cypress.sh --spec "cypress/e2e/auth/**/*.cy.ts"
#
# Requirements:
#   - Backend running on host port 3000  (cd backend && npm run dev)
#   - Frontend running on host port 4200 (cd frontend && npx ng serve)
#   - Dev proxy on host port 9000        (cd frontend && node dev-proxy.js)
#     The proxy forwards /* → :4200 and /api/* → :3000 without Vite's
#     host-check rejection (which blocks requests with Host: host.docker.internal).
# ---------------------------------------------------------------------------
set -e

# Resolve the frontend/ directory regardless of where the script is called from
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

docker run --rm \
  --add-host=host.docker.internal:host-gateway \
  -v "${SCRIPT_DIR}:/e2e" \
  -w /e2e \
  -e CYPRESS_baseUrl=http://host.docker.internal:9000 \
  -e CYPRESS_apiUrl=http://host.docker.internal:3000 \
  cypress/included:15.11.0 \
  cypress run \
    --browser electron \
    "$@"
