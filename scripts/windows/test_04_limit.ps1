# Test 04 — Reservation limit: fill all 30 tables for Sunday June 21 at 9 PM,
#           then go to the UI and attempt to book that slot to trigger the
#           "slot full" message. Windows equivalent of test_04_limit.sh.
# Rollback: run .\scripts\windows\test_04_limit_rollback.ps1
#
# Usage:
#   .\scripts\windows\test_04_limit.ps1
#
# Environment variables (all optional):
#   BASE_URL      — API base URL          (default: http://fausse-cafe.com)
#   DB_CONTAINER  — Postgres container    (default: fausse_cafe_db)
#   DB_USER       — Postgres user         (default: cafe_user)
#   DB_NAME       — Postgres database     (default: cafe_fausse)
$ErrorActionPreference = 'Stop'

$BaseUrl     = if ($env:BASE_URL)     { $env:BASE_URL }     else { 'http://fausse-cafe.com' }
$DbContainer = if ($env:DB_CONTAINER) { $env:DB_CONTAINER } else { 'fausse_cafe_db' }
$DbUser      = if ($env:DB_USER)      { $env:DB_USER }      else { 'cafe_user' }
$DbName      = if ($env:DB_NAME)      { $env:DB_NAME }      else { 'cafe_fausse' }

$TestSlot   = '2026-06-21T21:00:00'
$TestSlotDb = '2026-06-21 21:00:00'
$TestDate   = '2026-06-21'   # date portion of $TestSlot, for the availability API
$TestTime   = '21:00'        # time portion, to pick the 9:00 PM slot out of the day

function Invoke-Db([string]$Sql) {
  docker exec $DbContainer psql -U $DbUser -d $DbName -c $Sql
}

# Print availability for the 9 PM slot via GET /api/availability/day.
function Show-Slot {
  $day = Invoke-RestMethod -Uri "$BaseUrl/api/availability/day?date=$TestDate"
  $day.slots | Where-Object { $_.time -eq $TestTime } | ConvertTo-Json -Depth 10
}

Write-Host '========================================='
Write-Host ' TEST 04 — Reservation Limit (30 tables)'
Write-Host ' Slot: Sunday June 21, 2026 at 9:00 PM'
Write-Host " BASE_URL: $BaseUrl"
Write-Host '========================================='
Write-Host ''

Write-Host '--- BEFORE: existing reservations for this slot ---'
Invoke-Db "SELECT reservation_id, customer_id, time_slot, guest_count, table_number FROM reservations WHERE time_slot = '$TestSlotDb';"

Write-Host '--- BEFORE: availability via API (9:00 PM slot) ---'
Show-Slot
Write-Host ''

Write-Host '--- Action: fill all 30 tables via DB ---'
Invoke-Db @"
  INSERT INTO customers (customer_name, customer_email, newsletter_signup)
  SELECT 'Load Test User ' || i, 'loadtest' || i || '@example.com', FALSE
  FROM generate_series(1, 30) AS s(i)
  ON CONFLICT (customer_email) DO NOTHING;

  INSERT INTO reservations (customer_id, time_slot, guest_count, table_number)
  SELECT c.customer_id, '$TestSlotDb', 2, s.i
  FROM generate_series(1, 30) AS s(i)
  JOIN customers c ON c.customer_email = 'loadtest' || s.i || '@example.com'
  ON CONFLICT DO NOTHING;
"@
Write-Host ''

Write-Host '--- AFTER: reservations for this slot (should be 30) ---'
Invoke-Db "SELECT COUNT(*) AS booked_tables FROM reservations WHERE time_slot = '$TestSlotDb';"

Write-Host '--- AFTER: availability via API (9:00 PM slot, should show 0 available) ---'
Show-Slot
Write-Host ''

Write-Host '========================================='
Write-Host ' All 30 tables are now booked.'
Write-Host ''
Write-Host " --> Go to $BaseUrl"
Write-Host ' --> Navigate to Reservations'
Write-Host ' --> Select: Sunday June 21, 2026 at 9:00 PM'
Write-Host ' --> Fill in your details and submit'
Write-Host " --> You should see: 'That time slot is full'"
Write-Host '========================================='
Write-Host ''
Write-Host 'When done, run: .\scripts\windows\test_04_limit_rollback.ps1'
