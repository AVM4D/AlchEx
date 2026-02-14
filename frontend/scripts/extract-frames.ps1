###############################################################################
# extract-frames.ps1
# 
# Extracts frames from hands.mp4, removes the black background (keying),
# and exports as WebP with alpha transparency.
#
# PREREQUISITES:
#   1. Install FFmpeg:  winget install FFmpeg
#   2. Install Python:  winget install Python.Python.3
#   3. pip install Pillow numpy
#
# USAGE:
#   Place hands.mp4 in frontend/public/
#   Run from frontend/ directory:
#     powershell -ExecutionPolicy Bypass -File scripts/extract-frames.ps1
#
# OUTPUT:
#   frontend/public/frames/hands/frame-0001.webp ... frame-NNNN.webp
###############################################################################

param(
    [string]$VideoPath = "public/hands.mp4",
    [string]$OutputDir = "public/frames/hands",
    [int]$FPS = 30,             # 8s * 30fps = 240 frames
    [int]$Quality = 85,         # WebP quality (0-100)
    [int]$BlackThreshold = 40   # Luminance below this → transparent (0-255)
)

$ErrorActionPreference = "Stop"

# ─── Verify prerequisites ───
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
    Write-Error "FFmpeg not found. Install with: winget install FFmpeg"
    exit 1
}
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Error "Python not found. Install with: winget install Python.Python.3"
    exit 1
}
if (-not (Test-Path $VideoPath)) {
    Write-Error "Video file not found at: $VideoPath"
    exit 1
}

# ─── Create output directories ───
$rawDir = "$OutputDir/raw"
New-Item -ItemType Directory -Force -Path $rawDir | Out-Null
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  AlchEx Frame Extractor" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ─── Step 1: Extract raw PNG frames with FFmpeg ───
Write-Host "[1/3] Extracting frames at ${FPS}fps..." -ForegroundColor Yellow
ffmpeg -i $VideoPath -vf "fps=$FPS" -start_number 1 "$rawDir/frame-%04d.png" -y -loglevel warning
$frameCount = (Get-ChildItem "$rawDir/*.png" | Measure-Object).Count
Write-Host "       Extracted $frameCount raw frames." -ForegroundColor Green

# ─── Step 2: Remove black background + convert to WebP with alpha ───
Write-Host "[2/3] Removing black background and converting to WebP..." -ForegroundColor Yellow

$pythonScript = @"
import os, sys
from PIL import Image
import numpy as np

raw_dir    = sys.argv[1]
output_dir = sys.argv[2]
threshold  = int(sys.argv[3])
quality    = int(sys.argv[4])

files = sorted([f for f in os.listdir(raw_dir) if f.endswith('.png')])
total = len(files)

for i, fname in enumerate(files):
    img = Image.open(os.path.join(raw_dir, fname)).convert('RGBA')
    data = np.array(img)
    
    # Calculate luminance from RGB
    r, g, b = data[:,:,0].astype(float), data[:,:,1].astype(float), data[:,:,2].astype(float)
    luminance = 0.299 * r + 0.587 * g + 0.114 * b
    
    # Create alpha mask: smooth falloff near threshold for anti-aliased edges
    alpha = np.clip((luminance - threshold * 0.5) / (threshold * 0.8), 0, 1)
    alpha = (alpha * 255).astype(np.uint8)
    
    data[:,:,3] = alpha
    
    result = Image.fromarray(data, 'RGBA')
    out_name = fname.replace('.png', '.webp')
    result.save(os.path.join(output_dir, out_name), 'WEBP', quality=quality, method=4)
    
    pct = int((i + 1) / total * 100)
    print(f"\r       Processing: {pct}% ({i+1}/{total})", end='', flush=True)

print()
print(f"       Done! {total} WebP frames saved.")
"@

$scriptPath = "$env:TEMP/alchex_remove_bg.py"
$pythonScript | Out-File -FilePath $scriptPath -Encoding UTF8

python $scriptPath $rawDir $OutputDir $BlackThreshold $Quality

# ─── Step 3: Cleanup ───
Write-Host "[3/3] Cleaning up raw frames..." -ForegroundColor Yellow
Remove-Item -Recurse -Force $rawDir
Remove-Item -Force $scriptPath

$finalCount = (Get-ChildItem "$OutputDir/*.webp" | Measure-Object).Count
Write-Host ""
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  Complete! $finalCount frames in $OutputDir" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Next: Update TOTAL_FRAMES in ScrollVideoSection.tsx to $finalCount" -ForegroundColor Cyan
