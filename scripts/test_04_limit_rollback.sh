#!/usr/bin/env bash
# Rollback for Test 04 — removes the 30 load test reservations and customers
#                        inserted by test_04_limit.sh
#
# Usage:
#   ./scripts/test_04_limit_rollback.sh
#
# Environment variables (all optional):
#   DB_CONTAINER  — Postgres container    (default: fausse_cafe_db)
#   DB_USER       — Postgres user         (default: cafe_user)
#   DB_NAME       — Postgres database     (default: cafe_fausse)
set -euo pipefail

DB_CONTAINER="${DB_CONTAINER:-fausse_cafe_db}"
DB_USER="${DB_USER:-cafe_user}"
DB_NAME="${DB_NAME:-cafe_fausse}"

TEST_SLOT_DB="2026-06-21 21:00:00"

db() { docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "$1"; }

echo "========================================="
echo " ROLLBACK 04 — Reservation Limit"
echo " Slot: Sunday June 21, 2026 at 9:00 PM"
echo "========================================="
echo

echo "--- BEFORE rollback: reservations for test slot ---"
db "SELECT COUNT(*) AS booked_tables FROM reservations WHERE time_slot = '$TEST_SLOT_DB';"

echo "--- BEFORE rollback: load test customers ---"
db "SELECT COUNT(*) AS load_test_customers FROM customers WHERE customer_email LIKE 'loadtest%@example.com';"
echo

echo "--- Action: delete all test data ---"
db "
  DELETE FROM reservations WHERE time_slot = '$TEST_SLOT_DB'
    AND customer_id IN (SELECT customer_id FROM customers WHERE customer_email LIKE 'loadtest%@example.com');
  DELETE FROM customers WHERE customer_email LIKE 'loadtest%@example.com';
"
echo

echo "--- AFTER rollback: reservations for test slot ---"
db "SELECT COUNT(*) AS booked_tables FROM reservations WHERE time_slot = '$TEST_SLOT_DB';"

echo "--- AFTER rollback: load test customers ---"
db "SELECT COUNT(*) AS load_test_customers FROM customers WHERE customer_email LIKE 'loadtest%@example.com';"
echo

echo "Rollback complete."
