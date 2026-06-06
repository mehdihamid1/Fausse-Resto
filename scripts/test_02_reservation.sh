#!/usr/bin/env bash
# Test 02 — Single reservation: create booking, show DB before/after.
# Rollback: run ./scripts/test_02_reservation_rollback.sh
#
# Usage:
#   ./scripts/test_02_reservation.sh
#
# Environment variables (all optional):
#   BASE_URL      — API base URL          (default: http://fausse-cafe.com)
#   DB_CONTAINER  — Postgres container    (default: fausse_cafe_db)
#   DB_USER       — Postgres user         (default: cafe_user)
#   DB_NAME       — Postgres database     (default: cafe_fausse)
set -euo pipefail

BASE_URL="${BASE_URL:-http://fausse-cafe.com}"
DB_CONTAINER="${DB_CONTAINER:-fausse_cafe_db}"
DB_USER="${DB_USER:-cafe_user}"
DB_NAME="${DB_NAME:-cafe_fausse}"

# Book a slot inside the bookable window so the change is visible in the UI:
# ~14 days out, 7:00 PM seating, skipping Monday (the restaurant is closed).
SLOT_PAIR=$(python3 <<'PY'
from datetime import datetime, timedelta, time
d = (datetime.now() + timedelta(days=14)).date()
while d.weekday() == 0:          # 0 = Monday (closed)
    d += timedelta(days=1)
s = datetime.combine(d, time(19))   # 7:00 PM
print(s.strftime('%Y-%m-%dT%H:%M:%S') + '|' + s.strftime('%Y-%m-%d %H:%M:%S'))
PY
)
TEST_SLOT="${SLOT_PAIR%%|*}"
TEST_SLOT_DB="${SLOT_PAIR##*|}"
TEST_EMAIL="test.reservation@example.com"
TEST_NAME="Test User Two"
TMPFILE=$(mktemp)

db() { docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "$1"; }
cleanup() { rm -f "$TMPFILE"; }
trap cleanup EXIT

echo "========================================="
echo " TEST 02 — Single Reservation"
echo " BASE_URL: $BASE_URL"
echo " Slot: $TEST_SLOT_DB (book this in the UI to see availability drop)"
echo "========================================="
echo

echo "--- BEFORE: customers matching test email ---"
db "SELECT customer_id, customer_name, customer_email, newsletter_signup FROM customers WHERE customer_email = '$TEST_EMAIL';"

echo "--- BEFORE: reservations for test slot ---"
db "SELECT reservation_id, customer_id, time_slot, guest_count, table_number FROM reservations WHERE time_slot = '$TEST_SLOT_DB';"
echo

echo "--- Action: POST /api/reservations ---"
HTTP_CODE=$(curl -s -o "$TMPFILE" -w "%{http_code}" -X POST "$BASE_URL/api/reservations" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$TEST_NAME\",
    \"email\": \"$TEST_EMAIL\",
    \"phone\": \"555-0100\",
    \"timeSlot\": \"$TEST_SLOT\",
    \"guestCount\": 2,
    \"newsletterSignup\": false
  }")

echo "HTTP Status: $HTTP_CODE"
echo "Response:"
python3 -m json.tool "$TMPFILE"
echo

if [ "$HTTP_CODE" != "201" ]; then
  echo "FAIL: Expected 201, got $HTTP_CODE"
  exit 1
fi

echo "--- AFTER: customers matching test email ---"
db "SELECT customer_id, customer_name, customer_email, newsletter_signup FROM customers WHERE customer_email = '$TEST_EMAIL';"

echo "--- AFTER: reservations for test slot ---"
db "SELECT reservation_id, customer_id, time_slot, guest_count, table_number FROM reservations WHERE time_slot = '$TEST_SLOT_DB';"
echo

echo "PASS: Reservation created successfully."
echo "To clean up, run: ./scripts/test_02_reservation_rollback.sh"
