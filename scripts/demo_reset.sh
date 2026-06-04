#!/usr/bin/env bash
# Demo helper — reset to a clean slate before/between takes: clears all
# customers (reservations cascade) and empties the Mailpit inbox so the
# before/after database effect reads cleanly on camera.
#
# Usage:
#   ./scripts/demo_reset.sh
#
# Environment variables (all optional):
#   DB_CONTAINER  — Postgres container    (default: fausse_cafe_db)
#   DB_USER       — Postgres user         (default: cafe_user)
#   DB_NAME       — Postgres database     (default: cafe_fausse)
#   MAILPIT_URL   — Mailpit base URL      (default: http://localhost:8025)
set -euo pipefail

DB_CONTAINER="${DB_CONTAINER:-fausse_cafe_db}"
DB_USER="${DB_USER:-cafe_user}"
DB_NAME="${DB_NAME:-cafe_fausse}"
MAILPIT_URL="${MAILPIT_URL:-http://localhost:8025}"

db() { docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "$1"; }

echo "========================================="
echo " DEMO RESET — clean slate"
echo "========================================="
echo

echo "--- Clearing reservations and customers ---"
db "DELETE FROM reservations;"
db "DELETE FROM customers;"
echo

echo "--- Clearing Mailpit inbox ---"
if curl -fsS -X DELETE "$MAILPIT_URL/api/v1/messages" -o /dev/null; then
  echo "Mailpit inbox cleared."
else
  echo "Note: could not reach Mailpit at $MAILPIT_URL (is the stack up?). Skipping."
fi
echo

echo "--- Current state ---"
db "SELECT (SELECT count(*) FROM customers) AS customers, (SELECT count(*) FROM reservations) AS reservations;"
echo
echo "Clean. Ready to record."
