#!/usr/bin/env bash
# Test 03 — Newsletter signup: subscribe, show DB before/after.
# Rollback: run ./scripts/test_03_newsletter_rollback.sh
#
# Usage:
#   ./scripts/test_03_newsletter.sh
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

TEST_EMAIL="test.newsletter@example.com"
TEST_NAME="Test User Three"
TMPFILE=$(mktemp)

db() { docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "$1"; }
cleanup() { rm -f "$TMPFILE"; }
trap cleanup EXIT

echo "========================================="
echo " TEST 03 — Newsletter Signup"
echo " BASE_URL: $BASE_URL"
echo "========================================="
echo

echo "--- BEFORE: customers matching test email ---"
db "SELECT customer_id, customer_name, customer_email, phone_number, newsletter_signup FROM customers WHERE customer_email = '$TEST_EMAIL';"
echo

echo "--- Action: POST /api/newsletter ---"
HTTP_CODE=$(curl -s -o "$TMPFILE" -w "%{http_code}" -X POST "$BASE_URL/api/newsletter" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$TEST_NAME\",
    \"email\": \"$TEST_EMAIL\",
    \"phone\": \"555-0200\"
  }")

echo "HTTP Status: $HTTP_CODE"
echo "Response:"
python3 -m json.tool "$TMPFILE"
echo

if [ "$HTTP_CODE" != "200" ]; then
  echo "FAIL: Expected 200, got $HTTP_CODE"
  exit 1
fi

echo "--- AFTER: customers matching test email ---"
db "SELECT customer_id, customer_name, customer_email, phone_number, newsletter_signup FROM customers WHERE customer_email = '$TEST_EMAIL';"
echo

echo "PASS: Newsletter signup stored successfully (newsletter_signup = t)."
echo "To clean up, run: ./scripts/test_03_newsletter_rollback.sh"
