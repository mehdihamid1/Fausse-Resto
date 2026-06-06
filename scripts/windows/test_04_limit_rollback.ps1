# Rollback for Test 04 — removes the 30 load test reservations and customers
#                        inserted by test_04_limit.ps1. Windows equivalent of
#                        test_04_limit_rollback.sh.
#
# Usage:
#   .\scripts\windows\test_04_limit_rollback.ps1
#
# Environment variables (all optional):
#   DB_CONTAINER  — Postgres container    (default: fausse_cafe_db)
#   DB_USER       — Postgres user         (default: cafe_user)
#   DB_NAME       — Postgres database     (default: cafe_fausse)
$ErrorActionPreference = 'Stop'

$DbContainer = if ($env:DB_CONTAINER) { $env:DB_CONTAINER } else { 'fausse_cafe_db' }
$DbUser      = if ($env:DB_USER)      { $env:DB_USER }      else { 'cafe_user' }
$DbName      = if ($env:DB_NAME)      { $env:DB_NAME }      else { 'cafe_fausse' }

$TestSlotDb = '2026-06-21 21:00:00'

function Invoke-Db([string]$Sql) {
  docker exec $DbContainer psql -U $DbUser -d $DbName -c $Sql
}

Write-Host '========================================='
Write-Host ' ROLLBACK 04 — Reservation Limit'
Write-Host ' Slot: Sunday June 21, 2026 at 9:00 PM'
Write-Host '========================================='
Write-Host ''

Write-Host '--- BEFORE rollback: reservations for test slot ---'
Invoke-Db "SELECT COUNT(*) AS booked_tables FROM reservations WHERE time_slot = '$TestSlotDb';"

Write-Host '--- BEFORE rollback: load test customers ---'
Invoke-Db "SELECT COUNT(*) AS load_test_customers FROM customers WHERE customer_email LIKE 'loadtest%@example.com';"
Write-Host ''

Write-Host '--- Action: delete all test data ---'
Invoke-Db @"
  DELETE FROM reservations WHERE time_slot = '$TestSlotDb'
    AND customer_id IN (SELECT customer_id FROM customers WHERE customer_email LIKE 'loadtest%@example.com');
  DELETE FROM customers WHERE customer_email LIKE 'loadtest%@example.com';
"@
Write-Host ''

Write-Host '--- AFTER rollback: reservations for test slot ---'
Invoke-Db "SELECT COUNT(*) AS booked_tables FROM reservations WHERE time_slot = '$TestSlotDb';"

Write-Host '--- AFTER rollback: load test customers ---'
Invoke-Db "SELECT COUNT(*) AS load_test_customers FROM customers WHERE customer_email LIKE 'loadtest%@example.com';"
Write-Host ''

Write-Host 'Rollback complete.'
