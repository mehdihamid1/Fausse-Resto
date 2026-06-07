#!/usr/bin/env bash
# List all customers subscribed to the newsletter.
#
# Usage:
#   ./scripts/list_newsletter_subscribers.sh
#
# Environment variables (all optional):
#   DB_CONTAINER  — Postgres container    (default: fausse_cafe_db)
#   DB_USER       — Postgres user         (default: cafe_user)
#   DB_NAME       — Postgres database     (default: cafe_fausse)
set -euo pipefail

DB_CONTAINER="${DB_CONTAINER:-fausse_cafe_db}"
DB_USER="${DB_USER:-cafe_user}"
DB_NAME="${DB_NAME:-cafe_fausse}"

db() { docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "$1"; }

echo "========================================="
echo " Newsletter Subscribers"
echo "========================================="
echo

db "SELECT customer_name, customer_email, phone_number
    FROM customers
    WHERE newsletter_signup = TRUE
    ORDER BY customer_id;"

echo
TOTAL=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -tAc \
  "SELECT COUNT(*) FROM customers WHERE newsletter_signup = TRUE;")
echo "Total: $TOTAL subscriber(s)"
