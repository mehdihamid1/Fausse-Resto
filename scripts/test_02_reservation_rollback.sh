#!/usr/bin/env bash
# Rollback for Test 02 — removes the reservation and customer created by test_02_reservation.sh
#
# Usage:
#   ./scripts/test_02_reservation_rollback.sh
#
# Environment variables (all optional):
#   DB_CONTAINER  — Postgres container    (default: fausse_cafe_db)
#   DB_USER       — Postgres user         (default: cafe_user)
#   DB_NAME       — Postgres database     (default: cafe_fausse)
set -euo pipefail

DB_CONTAINER="${DB_CONTAINER:-fausse_cafe_db}"
DB_USER="${DB_USER:-cafe_user}"
DB_NAME="${DB_NAME:-cafe_fausse}"

TEST_EMAIL="test.reservation@example.com"

db() { docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "$1"; }

echo "========================================="
echo " ROLLBACK 02 — Single Reservation"
echo "========================================="
echo

echo "--- BEFORE rollback: customers matching test email ---"
db "SELECT customer_id, customer_name, customer_email, newsletter_signup FROM customers WHERE customer_email = '$TEST_EMAIL';"

echo "--- BEFORE rollback: reservations for test customer ---"
db "SELECT reservation_id, customer_id, time_slot, guest_count, table_number FROM reservations WHERE customer_id IN (SELECT customer_id FROM customers WHERE customer_email = '$TEST_EMAIL');"
echo

echo "--- Action: delete test data ---"
db "DELETE FROM reservations WHERE customer_id IN (SELECT customer_id FROM customers WHERE customer_email = '$TEST_EMAIL');"
db "DELETE FROM customers WHERE customer_email = '$TEST_EMAIL';"
echo

echo "--- AFTER rollback: customers matching test email ---"
db "SELECT customer_id, customer_name, customer_email, newsletter_signup FROM customers WHERE customer_email = '$TEST_EMAIL';"

echo "--- AFTER rollback: reservations for test customer ---"
db "SELECT reservation_id, customer_id, time_slot, guest_count, table_number FROM reservations WHERE customer_id IN (SELECT customer_id FROM customers WHERE customer_email = '$TEST_EMAIL');"
echo

echo "Rollback complete."
