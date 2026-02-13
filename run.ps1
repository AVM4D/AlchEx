<# 
    AlchEx - Quick Start (Run Both Servers)
    Assumes dependencies are already installed and DB is set up.
    For first-time setup, run start.ps1 instead.
#>

$Root = Split-Path -Parent $MyInvocation.MyCommand.Definition
$Backend = Join-Path $Root "backend"
$Frontend = Join-Path $Root "frontend"

Write-Host ""
Write-Host "  🔮 Starting AlchEx..." -ForegroundColor Cyan
Write-Host "  Backend  → http://localhost:4000" -ForegroundColor Green
Write-Host "  Frontend → http://localhost:5173" -ForegroundColor Green
Write-Host "  Press Ctrl+C to stop" -ForegroundColor DarkGray
Write-Host ""

# Start backend as a separate process
$backendProcess = Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c cd /d `"$Backend`" && npm run dev" `
    -PassThru -WindowStyle Normal

# Give backend a moment
Start-Sleep -Seconds 2

# Start frontend in this window
Push-Location $Frontend
try {
    npm run dev
} finally {
    # Kill backend when frontend stops
    if ($backendProcess -and !$backendProcess.HasExited) {
        Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
        # Also kill child node processes
        Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
            $_.StartTime -gt $backendProcess.StartTime.AddSeconds(-5)
        } | Stop-Process -Force -ErrorAction SilentlyContinue
    }
    Pop-Location
}
