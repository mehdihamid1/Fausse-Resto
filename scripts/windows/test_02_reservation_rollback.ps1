# Rollback for Test 02 — removes the reservation and customer created by
# test_02_reservation.ps1. Windows equivalent of test_02_reservation_rollback.sh.
#
# Usage:
#   .\scripts\windows\test_02_reservation_rollback.ps1
#
# Environment variables (all optional):
#   DB_CONTAINER  — Postgres container    (default: fausse_cafe_db)
#   DB_USER       — Postgres user         (default: cafe_user)
#   DB_NAME       — Postgres database     (default: cafe_fausse)
$ErrorActionPreference = 'Stop'

$DbContainer = if ($env:DB_CONTAINER) { $env:DB_CONTAINER } else { 'fausse_cafe_db' }
$DbUser      = if ($env:DB_USER)      { $env:DB_USER }      else { 'cafe_user' }
$DbName      = if ($env:DB_NAME)      { $env:DB_NAME }      else { 'cafe_fausse' }

$TestEmail = 'test.reservation@example.com'

function Invoke-Db([string]$Sql) {
  docker exec $DbContainer psql -U $DbUser -d $DbName -c $Sql
}

Write-Host '========================================='
Write-Host ' ROLLBACK 02 — Single Reservation'
Write-Host '========================================='
Write-Host ''

Write-Host '--- BEFORE rollback: customers matching test email ---'
Invoke-Db "SELECT customer_id, customer_name, customer_email, newsletter_signup FROM customers WHERE customer_email = '$TestEmail';"

Write-Host '--- BEFORE rollback: reservations for test slot ---'
Invoke-Db "SELECT reservation_id, customer_id, time_slot, guest_count, table_number FROM reservations WHERE time_slot = '2027-01-09 19:00:00';"
Write-Host ''

Write-Host '--- Action: delete test data ---'
Invoke-Db "DELETE FROM reservations WHERE customer_id IN (SELECT customer_id FROM customers WHERE customer_email = '$TestEmail');"
Invoke-Db "DELETE FROM customers WHERE customer_email = '$TestEmail';"
Write-Host ''

Write-Host '--- AFTER rollback: customers matching test email ---'
Invoke-Db "SELECT customer_id, customer_name, customer_email, newsletter_signup FROM customers WHERE customer_email = '$TestEmail';"

Write-Host '--- AFTER rollback: reservations for test slot ---'
Invoke-Db "SELECT reservation_id, customer_id, time_slot, guest_count, table_number FROM reservations WHERE time_slot = '2027-01-09 19:00:00';"
Write-Host ''

Write-Host 'Rollback complete.'
