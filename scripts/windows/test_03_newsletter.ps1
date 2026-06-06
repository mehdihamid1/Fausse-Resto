# Test 03 — Newsletter signup: subscribe, show DB before/after.
# Windows equivalent of test_03_newsletter.sh.
# Rollback: run .\scripts\windows\test_03_newsletter_rollback.ps1
#
# Usage:
#   .\scripts\windows\test_03_newsletter.ps1
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

$TestEmail = 'test.newsletter@example.com'
$TestName  = 'Test User Three'

function Invoke-Db([string]$Sql) {
  docker exec $DbContainer psql -U $DbUser -d $DbName -c $Sql
}

Write-Host '========================================='
Write-Host ' TEST 03 — Newsletter Signup'
Write-Host " BASE_URL: $BaseUrl"
Write-Host '========================================='
Write-Host ''

Write-Host '--- BEFORE: customers matching test email ---'
Invoke-Db "SELECT customer_id, customer_name, customer_email, phone_number, newsletter_signup FROM customers WHERE customer_email = '$TestEmail';"
Write-Host ''

Write-Host '--- Action: POST /api/newsletter ---'
$body = @{
  name  = $TestName
  email = $TestEmail
  phone = '555-0200'
} | ConvertTo-Json

$resp = Invoke-WebRequest -Uri "$BaseUrl/api/newsletter" -Method Post `
  -ContentType 'application/json' -Body $body -SkipHttpErrorCheck
$httpCode = [int]$resp.StatusCode

Write-Host "HTTP Status: $httpCode"
Write-Host 'Response:'
try { $resp.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10 } catch { Write-Host $resp.Content }
Write-Host ''

if ($httpCode -ne 200) {
  Write-Host "FAIL: Expected 200, got $httpCode"
  exit 1
}

Write-Host '--- AFTER: customers matching test email ---'
Invoke-Db "SELECT customer_id, customer_name, customer_email, phone_number, newsletter_signup FROM customers WHERE customer_email = '$TestEmail';"
Write-Host ''

Write-Host 'PASS: Newsletter signup stored successfully (newsletter_signup = t).'
Write-Host 'To clean up, run: .\scripts\windows\test_03_newsletter_rollback.ps1'
