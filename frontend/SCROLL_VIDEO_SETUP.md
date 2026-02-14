# Scroll Video Frame Extraction Guide

## Overview

The `ScrollVideoSection` component renders pre-extracted image frames on a `<canvas>` element, controlled by scroll position. This provides Apple-level smooth scrollytelling—far superior to `video.currentTime` scrubbing.

## Prerequisites

| Tool    | Install                            |
| ------- | ---------------------------------- |
| FFmpeg  | `winget install FFmpeg`            |
| Python  | `winget install Python.Python.3`   |
| Pillow  | `pip install Pillow numpy`         |

## Quick Start

### 1. Place your video

Copy `hands.mp4` into:
```
frontend/public/hands.mp4
```

### 2. Run the extraction script

```powershell
cd frontend
powershell -ExecutionPolicy Bypass -File scripts/extract-frames.ps1
```

This will:
- Extract ~240 frames at 30fps using FFmpeg
- Remove the black background (luminance keying) with Python/Pillow
- Export as compressed WebP with alpha transparency
- Save to `frontend/public/frames/hands/frame-0001.webp` ... `frame-0240.webp`

### 3. Update frame count (if needed)

Open `src/components/landing/ScrollVideoSection.tsx` and set `TOTAL_FRAMES` to match your actual frame count (shown at the end of the script output).

### 4. Run the app

```bash
npm run dev
```

Scroll past the hero section — the hands animation will scrub forward and backward smoothly.

---

## Folder Structure

```
frontend/
├── public/
│   ├── hands.mp4                     ← Source video
│   └── frames/
│       └── hands/
│           ├── frame-0001.webp       ← Extracted frames
│           ├── frame-0002.webp
│           ├── ...
│           └── frame-0240.webp
├── scripts/
│   └── extract-frames.ps1           ← Extraction script
└── src/
    └── components/
        └── landing/
            └── ScrollVideoSection.tsx ← The component
```

---

## Customization Options

### Script Parameters

```powershell
# Custom FPS (fewer frames = smaller payload, less smooth)
powershell -File scripts/extract-frames.ps1 -FPS 24

# Adjust black removal sensitivity (higher = more aggressive)
powershell -File scripts/extract-frames.ps1 -BlackThreshold 60

# Higher quality WebP (larger files)
powershell -File scripts/extract-frames.ps1 -Quality 95
```

### Component Configuration

In `ScrollVideoSection.tsx`:

| Constant          | Default   | Description                                      |
| ----------------- | --------- | ------------------------------------------------ |
| `TOTAL_FRAMES`    | `240`     | Must match extracted frame count                 |
| `FRAME_PATH`      | `/frames/hands` | Path relative to public/                   |
| `PRELOAD_BATCH`   | `20`      | Frames loaded immediately (first interaction)    |
| `LERP_FACTOR`     | `0.08`    | Smoothing factor (lower = smoother, slower)      |
| `SECTION_HEIGHT`  | `400vh`   | Scroll runway (more height = slower scrub)       |

### Text Overlays

Edit the `TEXT_OVERLAYS` array to change the text that fades in/out during scroll:

```tsx
const TEXT_OVERLAYS: TextOverlay[] = [
  { text: 'Your headline',  sub: 'Your subtitle',  range: [0.05, 0.30] },
  // range: [scrollStart, scrollEnd] where 0=top, 1=bottom
];
```

---

## Performance Notes

- **Preloading**: First 20 frames load immediately; rest load in chunks of 10 with `setTimeout(0)` yielding between batches
- **Retina**: Canvas scales to `devicePixelRatio` (capped at 2x for performance)
- **No re-renders**: All animation state is in refs; React never re-renders during scroll
- **requestAnimationFrame**: Animation loop runs at display refresh rate
- **Lerp interpolation**: Smooths frame transitions to prevent stutter
- **Redundancy check**: Skips canvas draw if frame hasn't changed

## Troubleshooting

| Issue | Fix |
|-------|-----|
| White flash on load | First 20 frames preload before any draw; increase `PRELOAD_BATCH` if needed |
| Choppy scrubbing | Lower `LERP_FACTOR` to `0.04`; ensure all frames loaded |
| Black bg visible | Increase `BlackThreshold` in extraction script |
| Too fast/slow | Adjust `SECTION_HEIGHT` — more vh = slower scrub |
| Frames not found | Verify path matches; check browser Network tab for 404s |
