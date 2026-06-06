# Demo helper — reset to a clean slate before/between takes: clears all
# customers (reservations cascade) and empties the Mailpit inbox so the
# before/after database effect reads cleanly on camera.
# Windows equivalent of demo_reset.sh.
#
# Usage:
#   .\scripts\windows\demo_reset.ps1
#
# Environment variables (all optional):
#   DB_CONTAINER  — Postgres container    (default: fausse_cafe_db)
#   DB_USER       — Postgres user         (default: cafe_user)
#   DB_NAME       — Postgres database     (default: cafe_fausse)
#   MAILPIT_URL   — Mailpit base URL      (default: http://localhost:8025)
$ErrorActionPreference = 'Stop'

$DbContainer = if ($env:DB_CONTAINER) { $env:DB_CONTAINER } else { 'fausse_cafe_db' }
$DbUser      = if ($env:DB_USER)      { $env:DB_USER }      else { 'cafe_user' }
$DbName      = if ($env:DB_NAME)      { $env:DB_NAME }      else { 'cafe_fausse' }
$MailpitUrl  = if ($env:MAILPIT_URL)  { $env:MAILPIT_URL }  else { 'http://localhost:8025' }

function Invoke-Db([string]$Sql) {
  docker exec $DbContainer psql -U $DbUser -d $DbName -c $Sql
}

Write-Host '========================================='
Write-Host ' DEMO RESET — clean slate'
Write-Host '========================================='
Write-Host ''

Write-Host '--- Clearing reservations and customers ---'
Invoke-Db 'DELETE FROM reservations;'
Invoke-Db 'DELETE FROM customers;'
Write-Host ''

Write-Host '--- Clearing Mailpit inbox ---'
try {
  Invoke-RestMethod -Method Delete -Uri "$MailpitUrl/api/v1/messages" | Out-Null
  Write-Host 'Mailpit inbox cleared.'
} catch {
  Write-Host "Note: could not reach Mailpit at $MailpitUrl (is the stack up?). Skipping."
}
Write-Host ''

Write-Host '--- Current state ---'
Invoke-Db 'SELECT (SELECT count(*) FROM customers) AS customers, (SELECT count(*) FROM reservations) AS reservations;'
Write-Host ''
Write-Host 'Clean. Ready to record.'
