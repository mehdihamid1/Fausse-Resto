#!/usr/bin/env bash
# Rollback for Test 03 — removes the customer created by test_03_newsletter.sh
#
# Usage:
#   ./scripts/test_03_newsletter_rollback.sh
#
# Environment variables (all optional):
#   DB_CONTAINER  — Postgres container    (default: fausse_cafe_db)
#   DB_USER       — Postgres user         (default: cafe_user)
#   DB_NAME       — Postgres database     (default: cafe_fausse)
set -euo pipefail

DB_CONTAINER="${DB_CONTAINER:-fausse_cafe_db}"
DB_USER="${DB_USER:-cafe_user}"
DB_NAME="${DB_NAME:-cafe_fausse}"

TEST_EMAIL="test.newsletter@example.com"

db() { docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "$1"; }

echo "========================================="
echo " ROLLBACK 03 — Newsletter Signup"
echo "========================================="
echo

echo "--- BEFORE rollback: customers matching test email ---"
db "SELECT customer_id, customer_name, customer_email, phone_number, newsletter_signup FROM customers WHERE customer_email = '$TEST_EMAIL';"
echo

echo "--- Action: delete test customer ---"
db "DELETE FROM customers WHERE customer_email = '$TEST_EMAIL';"
echo

echo "--- AFTER rollback: customers matching test email ---"
db "SELECT customer_id, customer_name, customer_email, phone_number, newsletter_signup FROM customers WHERE customer_email = '$TEST_EMAIL';"
echo

echo "Rollback complete."
