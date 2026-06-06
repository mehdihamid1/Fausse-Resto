# Demo helper — print the Customers and Reservations tables. Run this on a
# second terminal during the demo to reveal the database effect right after a
# newsletter signup or a reservation (the rubric requires showing the effect in
# the database itself, not via an admin page). Windows equivalent of demo_show_db.sh.
#
# Usage:
#   .\scripts\windows\demo_show_db.ps1
#
# Environment variables (all optional):
#   DB_CONTAINER  — Postgres container    (default: fausse_cafe_db)
#   DB_USER       — Postgres user         (default: cafe_user)
#   DB_NAME       — Postgres database     (default: cafe_fausse)
$ErrorActionPreference = 'Stop'

$DbContainer = if ($env:DB_CONTAINER) { $env:DB_CONTAINER } else { 'fausse_cafe_db' }
$DbUser      = if ($env:DB_USER)      { $env:DB_USER }      else { 'cafe_user' }
$DbName      = if ($env:DB_NAME)      { $env:DB_NAME }      else { 'cafe_fausse' }

function Invoke-Db([string]$Sql) {
  docker exec $DbContainer psql -U $DbUser -d $DbName -c $Sql
}

Write-Host '===== customers ====='
Invoke-Db 'SELECT customer_id, customer_name, customer_email, phone_number, newsletter_signup FROM customers ORDER BY customer_id;'

Write-Host '===== reservations ====='
Invoke-Db 'SELECT reservation_id, customer_id, time_slot, guest_count, table_number FROM reservations ORDER BY reservation_id;'
