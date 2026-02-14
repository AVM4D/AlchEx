<# 
    AlchEx - Quick Start (Run Both Servers)
    Assumes dependencies are already installed and DB is set up.
    For first-time setup, run start.ps1 instead.
#>

$Root = Split-Path -Parent $MyInvocation.MyCommand.Definition
$Backend = Join-Path $Root "backend"
$Frontend = Join-Path $Root "frontend"

# ─── Cleanup helper: kill any process holding a given port ───
function Stop-PortProcess($port) {
    $pids = netstat -ano 2>$null |
        Select-String ":\b$port\b\s.*LISTENING" |
        ForEach-Object { ($_ -split '\s+')[-1] } |
        Sort-Object -Unique |
        Where-Object { $_ -ne '0' -and $_ -match '^\d+$' }
    foreach ($p in $pids) {
        Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
    }
}

# ─── Kill leftover processes on our ports before starting ───
Write-Host ""
Write-Host "  Cleaning up stale processes..." -ForegroundColor DarkGray
Stop-PortProcess 4000
Stop-PortProcess 5173
Start-Sleep -Milliseconds 500

Write-Host "  Starting AlchEx..." -ForegroundColor Cyan
Write-Host "  Backend  -> http://localhost:4000" -ForegroundColor Green
Write-Host "  Frontend -> http://localhost:5173" -ForegroundColor Green
Write-Host "  Press Ctrl+C to stop both servers" -ForegroundColor DarkGray
Write-Host ""

# ─── Start backend in a separate window via cmd.exe ───
# npm on Windows is a .ps1/.cmd script, so we launch through cmd.exe
$backendProc = Start-Process cmd.exe `
    -ArgumentList "/c","cd /d `"$Backend`" && npm run dev" `
    -PassThru `
    -WindowStyle Normal

if (-not $backendProc) {
    Write-Host "  ERROR: Failed to start backend process!" -ForegroundColor Red
    exit 1
}
Write-Host "  Backend PID: $($backendProc.Id)" -ForegroundColor DarkGray

# ─── Wait for backend to be healthy before starting frontend ───
$maxWait = 30          # seconds
$elapsed = 0
$backendReady = $false
Write-Host "  Waiting for backend to be ready..." -ForegroundColor DarkGray
while ($elapsed -lt $maxWait) {
    # Check if process died
    if ($backendProc.HasExited) {
        Write-Host "  ERROR: Backend process exited with code $($backendProc.ExitCode)" -ForegroundColor Red
        exit 1
    }
    # Try hitting the health / root endpoint
    try {
        $resp = Invoke-WebRequest -Uri "http://localhost:4000/health" `
            -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($resp.StatusCode -eq 200) {
            $backendReady = $true
            break
        }
    } catch {
        # Not ready yet — keep waiting
    }
    Start-Sleep -Seconds 1
    $elapsed++
}

if ($backendReady) {
    Write-Host "  Backend is ready! (took ~${elapsed}s)" -ForegroundColor Green
} else {
    Write-Host "  WARNING: Backend didn't respond in ${maxWait}s, starting frontend anyway..." -ForegroundColor Yellow
}

# ─── Start frontend in this window (blocking) ───
Push-Location $Frontend
try {
    npm run dev
} finally {
    Write-Host ""
    Write-Host "  Shutting down..." -ForegroundColor Yellow

    # Kill the backend process tree (node + tsx child)
    if (-not $backendProc.HasExited) {
        # taskkill /T kills the entire process tree
        taskkill /PID $backendProc.Id /T /F 2>$null | Out-Null
    }

    # Safety net: kill anything still on our ports
    Stop-PortProcess 4000
    Stop-PortProcess 5173

    Pop-Location
    Write-Host "  AlchEx stopped." -ForegroundColor Cyan
}
