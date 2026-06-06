#!/usr/bin/env bash
# Test 04 — Reservation limit: fill all 30 tables for Sunday June 21 at 9 PM,
#           then go to the UI and attempt to book that slot to trigger the
#           "slot full" message.
# Rollback: run ./scripts/test_04_limit_rollback.sh
#
# Usage:
#   ./scripts/test_04_limit.sh
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

TEST_SLOT="2026-06-21T21:00:00"
TEST_SLOT_DB="2026-06-21 21:00:00"
TEST_DATE="2026-06-21"   # date portion of $TEST_SLOT, for the availability API
TEST_TIME="21:00"        # time portion, to pick the 9:00 PM slot out of the day

db() { docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "$1"; }

# Print availability for the 9 PM slot via GET /api/availability/day.
show_slot() {
  curl -s "$BASE_URL/api/availability/day?date=$TEST_DATE" \
    | python3 -c "import sys, json; d = json.load(sys.stdin); print(json.dumps(next((s for s in d['slots'] if s['time'] == '$TEST_TIME'), {}), indent=2))"
}

echo "========================================="
echo " TEST 04 — Reservation Limit (30 tables)"
echo " Slot: Sunday June 21, 2026 at 9:00 PM"
echo " BASE_URL: $BASE_URL"
echo "========================================="
echo

echo "--- BEFORE: existing reservations for this slot ---"
db "SELECT reservation_id, customer_id, time_slot, guest_count, table_number FROM reservations WHERE time_slot = '$TEST_SLOT_DB';"

echo "--- BEFORE: availability via API (9:00 PM slot) ---"
show_slot
echo

echo "--- Action: fill all 30 tables via DB ---"
db "
  INSERT INTO customers (customer_name, customer_email, newsletter_signup)
  SELECT 'Load Test User ' || i, 'loadtest' || i || '@example.com', FALSE
  FROM generate_series(1, 30) AS s(i)
  ON CONFLICT (customer_email) DO NOTHING;

  INSERT INTO reservations (customer_id, time_slot, guest_count, table_number)
  SELECT c.customer_id, '$TEST_SLOT_DB', 2, s.i
  FROM generate_series(1, 30) AS s(i)
  JOIN customers c ON c.customer_email = 'loadtest' || s.i || '@example.com'
  ON CONFLICT DO NOTHING;
"
echo

echo "--- AFTER: reservations for this slot (should be 30) ---"
db "SELECT COUNT(*) AS booked_tables FROM reservations WHERE time_slot = '$TEST_SLOT_DB';"

echo "--- AFTER: availability via API (9:00 PM slot, should show 0 available) ---"
show_slot
echo

echo "========================================="
echo " All 30 tables are now booked."
echo ""
echo " --> Go to $BASE_URL"
echo " --> Navigate to Reservations"
echo " --> Select: Sunday June 21, 2026 at 9:00 PM"
echo " --> Fill in your details and submit"
echo " --> You should see: 'That time slot is full'"
echo "========================================="
echo
echo "When done, run: ./scripts/test_04_limit_rollback.sh"
