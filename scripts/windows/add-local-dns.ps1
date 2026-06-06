# Adds "127.0.0.1 fausse-cafe.com" to the Windows hosts file.
# Windows equivalent of add-local-dns.sh. Editing the hosts file requires
# Administrator rights, so this self-elevates via a UAC prompt if needed.

$ErrorActionPreference = 'Stop'

$HostName  = 'fausse-cafe.com'
$HostEntry = "127.0.0.1 $HostName"
$HostsFile = Join-Path $env:windir 'System32\drivers\etc\hosts'

# Re-launch elevated if we are not already running as Administrator.
$isAdmin = ([Security.Principal.WindowsPrincipal] `
    [Security.Principal.WindowsIdentity]::GetCurrent()
  ).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
  Write-Host 'Requesting Administrator rights to edit the hosts file...'
  Start-Process pwsh -Verb RunAs -ArgumentList @(
    '-NoProfile', '-ExecutionPolicy', 'Bypass',
    '-File', "`"$PSCommandPath`""
  )
  exit
}

if (Select-String -Path $HostsFile -Pattern ([regex]::Escape($HostName)) -Quiet) {
  Write-Host "$HostName already exists in $HostsFile"
  exit 0
}

Add-Content -Path $HostsFile -Value "`r`n$HostEntry"
Write-Host "Added: $HostEntry"
