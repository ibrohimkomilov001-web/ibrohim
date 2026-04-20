#Requires -Version 5.1
<#
.SYNOPSIS
    TOPLA.UZ — GitHub-siz, to'g'ridan-to'g'ri SSH orqali deploy.

.DESCRIPTION
    Lokal kompyuterdan Yandex Cloud VM'ga deploy qiladi.
    - Lokal testlarni ishga tushiradi (vitest + tsc)
    - Kod arxivlanadi (node_modules, .git, .next chiqariladi)
    - scp orqali VM'ga yuboriladi
    - VM ichida zaxira olinadi → yangi kod ochiladi → docker compose up
    - Health check o'tmasa avtomatik rollback

.PARAMETER SkipTests
    Lokal testlarni o'tkazib yuborish (favqulodda holda).

.PARAMETER SkipBackendTests
    Faqat backend vitest'ni o'tkazib yuborish.

.PARAMETER DryRun
    Hamma narsa tayyorlanadi, lekin VM'ga hech narsa yuborilmaydi.

.EXAMPLE
    .\scripts\deploy.ps1

.EXAMPLE
    .\scripts\deploy.ps1 -SkipTests
#>
[CmdletBinding()]
param(
    [switch]$SkipTests,
    [switch]$SkipBackendTests,
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot  = Split-Path -Parent $ScriptDir
. (Join-Path $ScriptDir 'deploy\deploy.config.ps1')
$Cfg = $DeployConfig

$ReleaseId    = (Get-Date -Format 'yyyyMMdd_HHmmss')
$ArchiveName  = "topla-release-$ReleaseId.tar.gz"
$LocalArchive = Join-Path $env:TEMP $ArchiveName
$RemoteArchive = "$($Cfg.RemoteTmp)/$ArchiveName"
$RemoteScript = "$($Cfg.RemoteTmp)/remote-deploy-$ReleaseId.sh"

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
    param([string]$Command)
    & ssh -i $Cfg.SshKey -o StrictHostKeyChecking=no -o ConnectTimeout=15 `
          "$($Cfg.VmUser)@$($Cfg.VmHost)" $Command
    if ($LASTEXITCODE -ne 0) {
        throw "ssh failed (exit=$LASTEXITCODE): $Command"
    }
}

function Invoke-Scp {
    param([string]$Source, [string]$Destination)
    & scp -i $Cfg.SshKey -o StrictHostKeyChecking=no $Source `
          "$($Cfg.VmUser)@$($Cfg.VmHost):$Destination"
    if ($LASTEXITCODE -ne 0) {
        throw "scp failed (exit=$LASTEXITCODE)"
    }
}

# ---------------------------------------------------------------------------
# 0. Preconditions
# ---------------------------------------------------------------------------
Write-Step "Preconditions"

if (-not (Test-Path $Cfg.SshKey)) { Die "SSH key not found: $($Cfg.SshKey)" }
if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) { Die "ssh not installed" }
if (-not (Get-Command scp -ErrorAction SilentlyContinue)) { Die "scp not installed" }
if (-not (Get-Command tar -ErrorAction SilentlyContinue)) { Die "tar not installed (Windows 10+ built-in)" }
Write-Ok "Tools OK"

# SSH reachability
try {
    Invoke-Ssh 'echo CONNECTED' | Out-Null
    Write-Ok "SSH connection OK"
} catch {
    Die "Cannot reach VM via SSH: $_"
}

# ---------------------------------------------------------------------------
# 1. Local tests
# ---------------------------------------------------------------------------
if (-not $SkipTests) {
    Write-Step "Local tests"

    if (-not $SkipBackendTests) {
        Push-Location (Join-Path $RepoRoot 'topla-backend')
        Write-Host "    Running backend vitest..." -ForegroundColor DarkGray
        & npx vitest run 2>&1 | ForEach-Object {
            if ($_ -match 'Tests\s+\d+\s+(passed|failed)') { Write-Host "    $_" }
        }
        if ($LASTEXITCODE -ne 0) { Pop-Location; Die "Backend tests FAILED" }
        Pop-Location
        Write-Ok "Backend vitest passed"
    }

    Push-Location (Join-Path $RepoRoot 'topla-backend')
    Write-Host "    Running backend tsc..." -ForegroundColor DarkGray
    & npx tsc --noEmit 2>&1 | Select-Object -First 5
    if ($LASTEXITCODE -ne 0) { Pop-Location; Die "Backend tsc FAILED" }
    Pop-Location
    Write-Ok "Backend tsc clean"

    Push-Location (Join-Path $RepoRoot 'topla-web')
    Write-Host "    Running web tsc..." -ForegroundColor DarkGray
    & npx tsc --noEmit 2>&1 | Select-Object -First 5
    if ($LASTEXITCODE -ne 0) { Pop-Location; Die "Web tsc FAILED" }
    Pop-Location
    Write-Ok "Web tsc clean"
} else {
    Write-Warn "Tests SKIPPED (-SkipTests)"
}

# ---------------------------------------------------------------------------
# 2. Build exclusion list for tar
# ---------------------------------------------------------------------------
Write-Step "Building release archive ($ReleaseId)"

# tar --exclude patterns (glob-like). Works with Windows built-in bsdtar.
$excludeArgs = @()
foreach ($pat in $Cfg.Excludes) {
    $excludeArgs += "--exclude=$pat"
}

# Items to include (verified exist)
$includeArgs = @()
foreach ($item in $Cfg.Includes) {
    $full = Join-Path $RepoRoot $item
    if (-not (Test-Path $full)) { Die "Missing include: $item" }
    $includeArgs += $item
}

Push-Location $RepoRoot
if (Test-Path $LocalArchive) { Remove-Item $LocalArchive -Force }

# Use bsdtar (Windows) to create gzipped archive
$tarArgs = @('-czf', $LocalArchive) + $excludeArgs + $includeArgs
Write-Host "    tar $($tarArgs -join ' ')" -ForegroundColor DarkGray
& tar @tarArgs
if ($LASTEXITCODE -ne 0) { Pop-Location; Die "tar failed" }
Pop-Location

$sizeMb = [Math]::Round((Get-Item $LocalArchive).Length / 1MB, 1)
Write-Ok "Archive built: $LocalArchive (${sizeMb} MB)"

if ($DryRun) {
    Write-Warn "DryRun mode — stopping here. Archive kept at $LocalArchive"
    exit 0
}

# ---------------------------------------------------------------------------
# 3. Upload archive + remote script
# ---------------------------------------------------------------------------
Write-Step "Uploading to VM"

Invoke-Scp $LocalArchive $RemoteArchive
Write-Ok "Archive uploaded → $RemoteArchive"

$localRemoteScript = Join-Path $ScriptDir 'deploy\remote-deploy.sh'
Invoke-Scp $localRemoteScript $RemoteScript
Invoke-Ssh "chmod +x $RemoteScript"
Write-Ok "Remote script uploaded → $RemoteScript"

# ---------------------------------------------------------------------------
# 4. Run remote deploy
# ---------------------------------------------------------------------------
Write-Step "Running remote deploy on VM"
Write-Host "    (this takes 3-8 minutes — build + health check)" -ForegroundColor DarkGray

try {
    Invoke-Ssh "sudo bash $RemoteScript $RemoteArchive $ReleaseId"
    Write-Ok "Remote deploy completed"
} catch {
    Die "Remote deploy FAILED — VM likely rolled back automatically. Check VM logs."
}

# ---------------------------------------------------------------------------
# 5. Cleanup
# ---------------------------------------------------------------------------
Write-Step "Cleanup"

try {
    Invoke-Ssh "rm -f $RemoteArchive $RemoteScript"
    Write-Ok "Remote temp files removed"
} catch {
    Write-Warn "Failed to clean remote temp files: $_"
}

Remove-Item $LocalArchive -Force -ErrorAction SilentlyContinue
Write-Ok "Local archive removed"

# ---------------------------------------------------------------------------
# 6. Final status
# ---------------------------------------------------------------------------
Write-Step "Final container status"
Invoke-Ssh "sudo docker ps --format 'table {{.Names}}\t{{.Status}}' | head -12"

Write-Host ""
Write-Host "=================================================" -ForegroundColor Green
Write-Host "  ✓ Deploy OK — release $ReleaseId" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Rollback kerak bo'lsa:" -ForegroundColor Yellow
Write-Host "  .\scripts\rollback.ps1" -ForegroundColor Yellow
