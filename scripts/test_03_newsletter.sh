#!/usr/bin/env bash
# Test 03 — Newsletter signup: fresh signup, duplicate upsert, and validation
#            rejections.
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
TEST_EMAIL_NOPHONE="test.newsletter.nophone@example.com"
TEST_NAME="Test User Three"
TMPFILE=$(mktemp)

db()   { docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "$1"; }
post() {
  HTTP_CODE=$(curl -s -o "$TMPFILE" -w "%{http_code}" -X POST "$BASE_URL/api/newsletter" \
    -H "Content-Type: application/json" \
    -d "$1")
  echo "HTTP Status: $HTTP_CODE"
  echo "Response:"
  python3 -m json.tool "$TMPFILE"
  echo
}
cleanup() { rm -f "$TMPFILE"; }
trap cleanup EXIT

PASS=0
FAIL=0

pass() { echo "  PASS: $*"; PASS=$((PASS + 1)); }
fail() { echo "  FAIL: $*"; FAIL=$((FAIL + 1)); }
expect() {
  local want="$1"; shift
  if [ "$HTTP_CODE" = "$want" ]; then
    pass "$* (HTTP $HTTP_CODE)"
  else
    fail "$* — expected $want, got $HTTP_CODE"
  fi
}

echo "========================================="
echo " TEST 03 — Newsletter Signup"
echo " BASE_URL: $BASE_URL"
echo "========================================="
echo

# ── BEFORE ──────────────────────────────────────────────────────────────────
echo "--- BEFORE: customers matching test emails ---"
db "SELECT customer_id, customer_name, customer_email, phone_number, newsletter_signup
    FROM customers
    WHERE customer_email LIKE 'test.newsletter%@example.com'
    ORDER BY customer_id;"
echo

# ── Case 1: fresh signup ─────────────────────────────────────────────────────
echo "--- Case 1: fresh signup (name + email + phone) ---"
post "{\"name\": \"$TEST_NAME\", \"email\": \"$TEST_EMAIL\", \"phone\": \"555-0200\"}"
expect 200 "fresh signup"
db "SELECT customer_id, customer_name, customer_email, phone_number, newsletter_signup
    FROM customers WHERE customer_email = '$TEST_EMAIL';"
echo

# ── Case 2: duplicate signup (upsert — idempotent) ───────────────────────────
echo "--- Case 2: duplicate signup — same email again ---"
post "{\"name\": \"$TEST_NAME\", \"email\": \"$TEST_EMAIL\", \"phone\": \"555-0200\"}"
expect 200 "duplicate signup returns 200"
db "SELECT customer_id, customer_name, customer_email, phone_number, newsletter_signup
    FROM customers WHERE customer_email = '$TEST_EMAIL';"
echo

# ── Case 3: phone is optional ────────────────────────────────────────────────
echo "--- Case 3: signup without phone (phone is optional) ---"
post "{\"name\": \"No Phone User\", \"email\": \"$TEST_EMAIL_NOPHONE\"}"
expect 200 "signup without phone"
db "SELECT customer_id, customer_name, customer_email, phone_number, newsletter_signup
    FROM customers WHERE customer_email = '$TEST_EMAIL_NOPHONE';"
echo

# ── Case 4: missing name → 400 ───────────────────────────────────────────────
echo "--- Case 4: missing name → expect 400 ---"
post "{\"email\": \"$TEST_EMAIL\"}"
expect 400 "missing name rejected"

# ── Case 5: invalid email → 400 ──────────────────────────────────────────────
echo "--- Case 5: invalid email → expect 400 ---"
post "{\"name\": \"$TEST_NAME\", \"email\": \"not-an-email\"}"
expect 400 "invalid email rejected"

# ── AFTER ────────────────────────────────────────────────────────────────────
echo "--- AFTER: all test customers (2 rows expected) ---"
db "SELECT customer_id, customer_name, customer_email, phone_number, newsletter_signup
    FROM customers
    WHERE customer_email LIKE 'test.newsletter%@example.com'
    ORDER BY customer_id;"
echo

echo "--- All newsletter subscribers ---"
db "SELECT customer_name, customer_email, phone_number
    FROM customers
    WHERE newsletter_signup = TRUE
    ORDER BY customer_id;"
echo

# ── Summary ──────────────────────────────────────────────────────────────────
echo "========================================="
echo " Results: $PASS passed, $FAIL failed"
echo "========================================="
echo
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
echo "To clean up, run: ./scripts/test_03_newsletter_rollback.sh"
