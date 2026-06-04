#!/usr/bin/env bash
# Demo helper — print the Customers and Reservations tables. Run this on a
# second terminal during the demo to reveal the database effect right after a
# newsletter signup or a reservation (the rubric requires showing the effect in
# the database itself, not via an admin page).
#
# Usage:
#   ./scripts/demo_show_db.sh
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

echo "===== customers ====="
db "SELECT customer_id, customer_name, customer_email, phone_number, newsletter_signup FROM customers ORDER BY customer_id;"

echo "===== reservations ====="
db "SELECT reservation_id, customer_id, time_slot, guest_count, table_number FROM reservations ORDER BY reservation_id;"
