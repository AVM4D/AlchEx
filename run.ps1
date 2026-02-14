<# 
    AlchEx - Quick Start (Run Both Servers)
    Assumes dependencies are already installed and DB is set up.
    For first-time setup, run start.ps1 instead.
#>

$Root = Split-Path -Parent $MyInvocation.MyCommand.Definition
$Backend = Join-Path $Root "backend"
$Frontend = Join-Path $Root "frontend"

Write-Host ""
Write-Host "  Starting AlchEx..." -ForegroundColor Cyan
Write-Host "  Backend  -> http://localhost:4000" -ForegroundColor Green
Write-Host "  Frontend -> http://localhost:5173" -ForegroundColor Green
Write-Host "  Press Ctrl+C to stop" -ForegroundColor DarkGray
Write-Host ""

# Start backend in a separate PowerShell window
$backendProcess = Start-Process powershell -ArgumentList @(
    "-NoProfile"
    "-Command"
    "Set-Location '$Backend'; npm run dev"
) -PassThru -WindowStyle Normal

# Give backend a moment to start
Start-Sleep -Seconds 3

# Start frontend in this window
Push-Location $Frontend
try {
    npm run dev
} finally {
    # Kill backend when frontend stops
    if ($backendProcess -and -not $backendProcess.HasExited) {
        Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    }
    # Clean up any leftover node processes on port 4000
    $pids = netstat -ano 2>$null | Select-String ":4000\s" | ForEach-Object {
        ($_ -split '\s+')[-1]
    } | Sort-Object -Unique | Where-Object { $_ -ne '0' }
    foreach ($p in $pids) {
        Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
    }
    Pop-Location
}
