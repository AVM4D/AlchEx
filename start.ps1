# ═══════════════════════════════════════════════════════════════
#  AlchEx - One-Click Setup & Run Script
#  Just run this script and everything starts!
# ═══════════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Definition
$Backend = Join-Path $Root "backend"
$Frontend = Join-Path $Root "frontend"

function Write-Header($msg) {
    Write-Host ""
    Write-Host "  ╔════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "  ║  $msg" -ForegroundColor Cyan
    Write-Host "  ╚════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step($msg) {
    Write-Host "  → $msg" -ForegroundColor Yellow
}

function Write-Ok($msg) {
    Write-Host "  ✅ $msg" -ForegroundColor Green
}

function Write-Err($msg) {
    Write-Host "  ❌ $msg" -ForegroundColor Red
}

# ─── 0. Check prerequisites ───
Write-Header "🔮 AlchEx - Setup & Launch"
Write-Step "Checking prerequisites..."

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Ok "Node.js $nodeVersion found"
} catch {
    Write-Err "Node.js is not installed! Download from https://nodejs.org"
    Read-Host "Press Enter to exit"
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Ok "npm v$npmVersion found"
} catch {
    Write-Err "npm is not installed!"
    Read-Host "Press Enter to exit"
    exit 1
}

# ─── 1. Check SQL Server is running ───
Write-Step "Checking SQL Server..."

$sqlRunning = $false
$sqlServices = Get-Service -Name 'MSSQLSERVER', 'MSSQL$SQLEXPRESS', 'MSSQL$MSSQLSERVER01' -ErrorAction SilentlyContinue
foreach ($svc in $sqlServices) {
    if ($svc.Status -eq 'Running') {
        $sqlRunning = $true
        Write-Ok "SQL Server is running ($($svc.Name))"
        break
    }
}

if (-not $sqlRunning) {
    # Try to start SQL Server
    Write-Step "SQL Server not running. Attempting to start..."
    $sqlServices = Get-Service -Name 'MSSQLSERVER', 'MSSQL$SQLEXPRESS' -ErrorAction SilentlyContinue
    foreach ($svc in $sqlServices) {
        try {
            Start-Service $svc.Name
            Write-Ok "Started $($svc.Name)"
            $sqlRunning = $true
            break
        } catch {
            Write-Err "Could not start $($svc.Name). Try running as Administrator."
        }
    }
    if (-not $sqlRunning) {
        Write-Err "SQL Server is not running and could not be started."
        Write-Host "  Make sure SQL Server is installed and the service is running." -ForegroundColor Red
        Write-Host "  Then re-run this script." -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# ─── 2. Create database if it doesn't exist ───
Write-Step "Ensuring 'alchex' database exists..."

# Read connection info from .env
$envFile = Get-Content (Join-Path $Backend ".env") -Raw

# Try sqlcmd to create DB
$sqlcmdAvailable = $false
try {
    $null = Get-Command sqlcmd -ErrorAction Stop
    $sqlcmdAvailable = $true
} catch {}

if ($sqlcmdAvailable) {
    try {
        $createDbQuery = "IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'alchex') CREATE DATABASE [alchex];"
        # Use Windows Authentication (matches integratedSecurity=true in .env)
        sqlcmd -S "localhost\SQLEXPRESS" -E -Q $createDbQuery -C 2>&1 | Out-Null
        Write-Ok "Database 'alchex' is ready"
    } catch {
        Write-Host "  ⚠️  Could not auto-create database. Will try via Prisma..." -ForegroundColor DarkYellow
    }
} else {
    Write-Host "  ⚠️  sqlcmd not found. Prisma will create tables directly." -ForegroundColor DarkYellow
    Write-Host "     If this fails, manually create a database named 'alchex' in SSMS." -ForegroundColor DarkYellow
}

# ─── 3. Install backend dependencies ───
Write-Header "📦 Installing Dependencies"
Write-Step "Installing backend packages..."
Push-Location $Backend
try {
    npm install 2>&1 | Out-Null
    Write-Ok "Backend dependencies installed"
} catch {
    Write-Err "Failed to install backend dependencies"
    Pop-Location
    Read-Host "Press Enter to exit"
    exit 1
}

# ─── 4. Generate Prisma client ───
Write-Step "Generating Prisma client..."
try {
    npx prisma generate 2>&1 | Out-Null
    Write-Ok "Prisma client generated"
} catch {
    Write-Err "Failed to generate Prisma client"
}

# ─── 5. Push schema to database ───
Write-Step "Pushing schema to SQL Server..."
try {
    npx prisma db push --accept-data-loss 2>&1
    Write-Ok "Database schema synced"
} catch {
    Write-Err "Failed to push schema to database!"
    Write-Host "  Check your DATABASE_URL in backend\.env" -ForegroundColor Red
    Write-Host "  Make sure SQL Server is running and accessible" -ForegroundColor Red
    Pop-Location
    Read-Host "Press Enter to exit"
    exit 1
}
Pop-Location

# ─── 6. Install frontend dependencies ───
Write-Step "Installing frontend packages..."
Push-Location $Frontend
try {
    npm install 2>&1 | Out-Null
    Write-Ok "Frontend dependencies installed"
} catch {
    Write-Err "Failed to install frontend dependencies"
    Pop-Location
    Read-Host "Press Enter to exit"
    exit 1
}
Pop-Location

# ─── 7. Seed the database (optional, only if empty) ───
Write-Header "🌱 Database Seeding"
Write-Step "Seeding database with sample data..."
Push-Location $Backend
try {
    npx tsx src/prisma/seed.ts 2>&1
    Write-Ok "Database seeded with sample data"
} catch {
    Write-Host "  ⚠️  Seeding skipped or had issues (may already have data)" -ForegroundColor DarkYellow
}
Pop-Location

# ─── 8. Start both servers ───
Write-Header "🚀 Starting AlchEx"
Write-Host "  Backend  → http://localhost:4000" -ForegroundColor Green
Write-Host "  Frontend → http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "  Press Ctrl+C to stop both servers" -ForegroundColor DarkGray
Write-Host ""

# Start backend in background
$backendJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location $dir
    npm run dev 2>&1
} -ArgumentList $Backend

# Start frontend in foreground
Push-Location $Frontend
try {
    # Give backend a moment to start
    Start-Sleep -Seconds 2
    npm run dev
} finally {
    # Cleanup backend job when frontend stops
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -ErrorAction SilentlyContinue
    Pop-Location
}
