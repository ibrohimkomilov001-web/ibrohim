#Requires -Version 5.1
<#
.SYNOPSIS
    TOPLA.UZ — Rollback to previous release.

.DESCRIPTION
    VM'dagi eng so'nggi `topla.bak-*` zaxirasiga qaytaradi.
    `-ListOnly` bilan mavjud zaxiralarni ko'rish mumkin.
    `-BackupName` bilan aniq zaxirani tanlash mumkin.

.PARAMETER ListOnly
    Faqat mavjud zaxiralarni ko'rsatadi.

.PARAMETER BackupName
    Aniq zaxira nomi (masalan: topla.bak-20260420_143055).

.EXAMPLE
    .\scripts\rollback.ps1
    .\scripts\rollback.ps1 -ListOnly
    .\scripts\rollback.ps1 -BackupName topla.bak-20260420_143055
#>
[CmdletBinding()]
param(
    [switch]$ListOnly,
    [string]$BackupName
)

$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $ScriptDir 'deploy\deploy.config.ps1')
$Cfg = $DeployConfig

function Write-Step($msg) {
    Write-Host ""
    Write-Host "==> $msg" -ForegroundColor Cyan
}
function Write-Ok($msg)   { Write-Host "    ✓ $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "    ! $msg" -ForegroundColor Yellow }
function Die($msg) {
    Write-Host "    ✗ $msg" -ForegroundColor Red
    exit 1
}

function Invoke-Ssh {
    param([string]$Command, [switch]$PassThru)
    if ($PassThru) {
        return (& ssh -i $Cfg.SshKey -o StrictHostKeyChecking=no `
                      "$($Cfg.VmUser)@$($Cfg.VmHost)" $Command)
    }
    & ssh -i $Cfg.SshKey -o StrictHostKeyChecking=no `
          "$($Cfg.VmUser)@$($Cfg.VmHost)" $Command
    if ($LASTEXITCODE -ne 0) {
        throw "ssh failed (exit=$LASTEXITCODE)"
    }
}

function Invoke-Scp {
    param([string]$Source, [string]$Destination)
    & scp -i $Cfg.SshKey -o StrictHostKeyChecking=no $Source `
          "$($Cfg.VmUser)@$($Cfg.VmHost):$Destination"
    if ($LASTEXITCODE -ne 0) { throw "scp failed" }
}

# ---------------------------------------------------------------------------
# List backups
# ---------------------------------------------------------------------------
Write-Step "Available backups on VM"

$raw = Invoke-Ssh -PassThru 'ls -dt /home/yc-user/topla.bak-* 2>/dev/null | head -10 || true'
if (-not $raw) {
    Die "Hech qanday zaxira topilmadi."
}
$backups = @($raw -split "`n" | Where-Object { $_ -match 'topla\.bak-' })
for ($i = 0; $i -lt $backups.Count; $i++) {
    $name = Split-Path $backups[$i] -Leaf
    $marker = if ($i -eq 0) { ' (eng yangisi)' } else { '' }
    Write-Host ("    [{0}] {1}{2}" -f $i, $name, $marker)
}

if ($ListOnly) { return }

# ---------------------------------------------------------------------------
# Choose target
# ---------------------------------------------------------------------------
$target = $null
if ($BackupName) {
    $match = $backups | Where-Object { (Split-Path $_ -Leaf) -eq $BackupName }
    if (-not $match) { Die "Backup '$BackupName' topilmadi. -ListOnly bilan ko'ring." }
    $target = $match
} else {
    $target = $backups[0]
}

Write-Step "Rollback target: $(Split-Path $target -Leaf)"
$confirm = Read-Host "Rollback davom ettirilsinmi? (y/N)"
if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Warn "Bekor qilindi."
    return
}

# ---------------------------------------------------------------------------
# Upload remote-rollback.sh and run
# ---------------------------------------------------------------------------
Write-Step "Uploading rollback script"
$localScript = Join-Path $ScriptDir 'deploy\remote-rollback.sh'
$remoteScript = "$($Cfg.RemoteTmp)/remote-rollback-$((Get-Date -Format 'yyyyMMdd_HHmmss')).sh"
Invoke-Scp $localScript $remoteScript
Invoke-Ssh "chmod +x $remoteScript"
Write-Ok "Uploaded → $remoteScript"

Write-Step "Running rollback"
try {
    Invoke-Ssh "sudo bash $remoteScript $target"
    Write-Ok "Rollback completed"
} catch {
    Die "Rollback FAILED: $_"
}

Invoke-Ssh "rm -f $remoteScript" | Out-Null

Write-Host ""
Write-Host "=================================================" -ForegroundColor Green
Write-Host "  ✓ Rollback OK" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
