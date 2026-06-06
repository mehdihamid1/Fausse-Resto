# Test 02 — Single reservation: create booking, show DB before/after.
# Windows equivalent of test_02_reservation.sh.
# Rollback: run .\scripts\windows\test_02_reservation_rollback.ps1
#
# Usage:
#   .\scripts\windows\test_02_reservation.ps1
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

$TestSlot  = '2027-01-09T19:00:00'
$TestEmail = 'test.reservation@example.com'
$TestName  = 'Test User Two'

function Invoke-Db([string]$Sql) {
  docker exec $DbContainer psql -U $DbUser -d $DbName -c $Sql
}

Write-Host '========================================='
Write-Host ' TEST 02 — Single Reservation'
Write-Host " BASE_URL: $BaseUrl"
Write-Host '========================================='
Write-Host ''

Write-Host '--- BEFORE: customers matching test email ---'
Invoke-Db "SELECT customer_id, customer_name, customer_email, newsletter_signup FROM customers WHERE customer_email = '$TestEmail';"

Write-Host '--- BEFORE: reservations for test slot ---'
Invoke-Db "SELECT reservation_id, customer_id, time_slot, guest_count, table_number FROM reservations WHERE time_slot = '2027-01-09 19:00:00';"
Write-Host ''

Write-Host '--- Action: POST /api/reservations ---'
$body = @{
  name             = $TestName
  email            = $TestEmail
  phone            = '555-0100'
  timeSlot         = $TestSlot
  guestCount       = 2
  newsletterSignup = $false
} | ConvertTo-Json

$resp = Invoke-WebRequest -Uri "$BaseUrl/api/reservations" -Method Post `
  -ContentType 'application/json' -Body $body -SkipHttpErrorCheck
$httpCode = [int]$resp.StatusCode

Write-Host "HTTP Status: $httpCode"
Write-Host 'Response:'
try { $resp.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10 } catch { Write-Host $resp.Content }
Write-Host ''

if ($httpCode -ne 201) {
  Write-Host "FAIL: Expected 201, got $httpCode"
  exit 1
}

Write-Host '--- AFTER: customers matching test email ---'
Invoke-Db "SELECT customer_id, customer_name, customer_email, newsletter_signup FROM customers WHERE customer_email = '$TestEmail';"

Write-Host '--- AFTER: reservations for test slot ---'
Invoke-Db "SELECT reservation_id, customer_id, time_slot, guest_count, table_number FROM reservations WHERE time_slot = '2027-01-09 19:00:00';"
Write-Host ''

Write-Host 'PASS: Reservation created successfully.'
Write-Host 'To clean up, run: .\scripts\windows\test_02_reservation_rollback.ps1'
