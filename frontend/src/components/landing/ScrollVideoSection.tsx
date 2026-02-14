import React, { useRef, useEffect, useCallback, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

/* ═══════════════════════════════════════════════════════════════════════════
   ScrollVideoSection — Apple-style scrollytelling with frame-based canvas
   
   Core idea:
   • Pre-extract video into individual WebP frames with alpha
   • Use a tall wrapper (400vh) so the user scrolls through ~3200px
   • A sticky <canvas> fills the viewport
   • Scroll progress (0→1) maps to frame index
   • requestAnimationFrame + lerp = ultra-smooth interpolation
   • No flickering, no re-renders, no white flashes
   ═══════════════════════════════════════════════════════════════════════════ */

// ───── Configuration ─────
const TOTAL_FRAMES = 242;           // Matches extracted frame count
const FRAME_PATH = '/frames/hands'; // Relative to /public
const PRELOAD_BATCH = 20;           // Immediately preload first N frames
const LERP_FACTOR = 0.12;           // Smoothing (higher = more responsive)
const SECTION_HEIGHT = '350vh';     // Enough room for forward + reverse cycle

// ───── Text overlays that animate with scroll ─────
interface TextOverlay {
    text: string;
    /** scroll range [start, end] where 0-1 */
    range: [number, number];
}

// Forward (0→0.5) AND reverse (0.5→1.0) — non-overlapping ranges
const TEXT_OVERLAYS: TextOverlay[] = [
    { text: 'Humankind <span class="text-purple">cannot gain anything</span>', range: [0.04, 0.24] },
    { text: 'without first giving <span class="text-purple">something in return<span style="font-family:serif">.</span></span>', range: [0.26, 0.46] },
    { text: 'To obtain<span style="font-family:serif">,</span> something of equal value <span class="text-purple">must be lost<span style="font-family:serif">.</span></span>', range: [0.48, 0.72] },
    { text: "That is AlchEx<span style=\"font-family:serif\">'</span>s law of <span class=\"text-purple\">Equivalent Exchange<span style=\"font-family:serif\">.</span></span>", range: [0.74, 0.96] },
];

// ───── Utility: generate frame URL ─────
function getFrameSrc(index: number): string {
    const padded = String(index + 1).padStart(4, '0');
    return `${FRAME_PATH}/frame-${padded}.webp`;
}

// ───── Utility: lerp ─────
function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

// ───── Utility: clamp ─────
function clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
}

// ───── Utility: ease (cubic ease-in-out) ─────
function easeInOutCubic(t: number): number {
    return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════════════════ */
export default function ScrollVideoSection() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

    // Frame storage — never triggers re-renders
    const framesRef = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES).fill(null));
    const loadedCountRef = useRef(0);
    const currentFrameRef = useRef(0);    // actual rendered frame (lerped float)
    const targetFrameRef = useRef(0);     // target frame from scroll
    const rafIdRef = useRef(0);
    const lastDrawnFrameRef = useRef(-1); // avoid redundant draws

    const [isVisible, setIsVisible] = useState(false);
    const [isInView, setIsInView] = useState(false);

    // ── Framer Motion scroll tracking ──
    // 'start 0.85' = progress 0 when section top is 85% down the viewport
    //                (starts just after hero scrolls mostly away — no overlap)
    // 'end start'  = progress 1 when section bottom exits viewport top
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ['start 0.85', 'end start'],
    });

    // ── Load a single frame, returns a promise ──
    const loadFrame = useCallback((index: number): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
            if (framesRef.current[index]) {
                resolve(framesRef.current[index]!);
                return;
            }
            const img = new Image();
            img.src = getFrameSrc(index);
            img.onload = () => {
                framesRef.current[index] = img;
                loadedCountRef.current++;
                resolve(img);
            };
            img.onerror = reject;
        });
    }, []);

    // ── Draw a specific frame to the canvas ──
    const drawFrame = useCallback((index: number) => {
        const ctx = ctxRef.current;
        const canvas = canvasRef.current;
        if (!ctx || !canvas) return;

        const frameIndex = clamp(Math.round(index), 0, TOTAL_FRAMES - 1);
        if (frameIndex === lastDrawnFrameRef.current) return; // skip redundant

        const img = framesRef.current[frameIndex];
        if (!img) return;

        lastDrawnFrameRef.current = frameIndex;

        // Clear with transparent (preserves alpha channel content)
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw frame centered / cover
        const canvasAspect = canvas.width / canvas.height;
        const imgAspect = img.naturalWidth / img.naturalHeight;

        let drawW: number, drawH: number, drawX: number, drawY: number;

        if (imgAspect > canvasAspect) {
            // Image is wider — fit height, crop sides
            drawH = canvas.height;
            drawW = drawH * imgAspect;
            drawX = (canvas.width - drawW) / 2;
            drawY = 0;
        } else {
            // Image is taller — fit width, crop top/bottom
            drawW = canvas.width;
            drawH = drawW / imgAspect;
            drawX = 0;
            drawY = (canvas.height - drawH) / 2;
        }

        ctx.drawImage(img, drawX, drawY, drawW, drawH);
    }, []);

    // ── Animation loop: lerp current → target ──
    const animate = useCallback(() => {
        const target = targetFrameRef.current;
        const current = currentFrameRef.current;

        // Lerp for silky-smooth interpolation
        const next = lerp(current, target, LERP_FACTOR);

        // If close enough, snap to avoid infinite micro-updates
        currentFrameRef.current = Math.abs(next - target) < 0.1 ? target : next;

        drawFrame(currentFrameRef.current);
        rafIdRef.current = requestAnimationFrame(animate);
    }, [drawFrame]);

    // ── Canvas sizing: retina-aware ──
    const resizeCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap at 2x for perf
        const rect = canvas.getBoundingClientRect();

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        const ctx = canvas.getContext('2d', { alpha: true });
        if (ctx) {
            ctx.scale(dpr, dpr);
            ctxRef.current = ctx;
        }

        // Redraw current frame at new size
        lastDrawnFrameRef.current = -1;
        drawFrame(currentFrameRef.current);
    }, [drawFrame]);

    // ── Initialize: load frames, set up listeners ──
    useEffect(() => {
        // Get canvas context
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;
        ctxRef.current = ctx;

        resizeCanvas();

        // Observe visibility — track enter AND leave for fixed positioning
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsInView(entry.isIntersecting);
                if (entry.isIntersecting) {
                    setIsVisible(true); // once true, stays true (fade-in only once)
                }
            },
            { threshold: 0 }
        );
        if (sectionRef.current) observer.observe(sectionRef.current);

        // Listen for resize
        window.addEventListener('resize', resizeCanvas);

        // ── Frame loading strategy ──
        // Phase 1: Load first batch for instant interaction
        const loadInitialFrames = async () => {
            const first = Array.from({ length: PRELOAD_BATCH }, (_, i) => i);
            await Promise.all(first.map(loadFrame));

            // Draw first frame immediately
            drawFrame(0);

            // Phase 2: Progressively load remaining frames
            // Load in chunks to avoid blocking the main thread
            const chunkSize = 10;
            for (let start = PRELOAD_BATCH; start < TOTAL_FRAMES; start += chunkSize) {
                const end = Math.min(start + chunkSize, TOTAL_FRAMES);
                const batch = Array.from({ length: end - start }, (_, i) => start + i);
                await Promise.all(batch.map(loadFrame));
                // Yield to main thread between chunks
                await new Promise((r) => setTimeout(r, 0));
            }
        };

        loadInitialFrames();

        // ── Start animation loop ──
        rafIdRef.current = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(rafIdRef.current);
            window.removeEventListener('resize', resizeCanvas);
            observer.disconnect();
        };
    }, [animate, drawFrame, loadFrame, resizeCanvas]);

    // ── Update target frame when scroll changes ──
    // Scroll 0→0.5: forward  frame 0 → frame 241  (last frame)
    // Scroll 0.5→1: reverse  frame 241 → frame 0  (exact mirror)
    useEffect(() => {
        const lastFrame = TOTAL_FRAMES - 1;
        const unsubscribe = scrollYProgress.on('change', (v) => {
            const clamped = clamp(v, 0, 1);
            let frameIndex: number;
            if (clamped <= 0.5) {
                // Forward: linearly map 0→0.5 to frame 0→lastFrame
                frameIndex = (clamped / 0.5) * lastFrame;
            } else {
                // Reverse: linearly map 0.5→1.0 to frame lastFrame→0
                frameIndex = ((1.0 - clamped) / 0.5) * lastFrame;
            }
            targetFrameRef.current = clamp(frameIndex, 0, lastFrame);
        });
        return unsubscribe;
    }, [scrollYProgress]);

    // ── Compute text overlay opacity based on scroll ──
    const overlayOpacities = TEXT_OVERLAYS.map((overlay) => {
        const midpoint = (overlay.range[0] + overlay.range[1]) / 2;
        const halfWidth = (overlay.range[1] - overlay.range[0]) / 2;
        // eslint-disable-next-line react-hooks/rules-of-hooks
        return useTransform(scrollYProgress, (v: number) => {
            const dist = Math.abs(v - midpoint);
            if (dist > halfWidth) return 0;
            // Smooth fade: fully visible in center 60%, fade at edges
            const t = 1 - dist / halfWidth;
            return clamp(t * 1.5, 0, 1);
        });
    });

    const overlayYs = TEXT_OVERLAYS.map((overlay) => {
        const midpoint = (overlay.range[0] + overlay.range[1]) / 2;
        const halfWidth = (overlay.range[1] - overlay.range[0]) / 2;
        // eslint-disable-next-line react-hooks/rules-of-hooks
        return useTransform(scrollYProgress, (v: number) => {
            const dist = v - midpoint;
            const normalized = dist / halfWidth; // -1 to 1
            return normalized * 40; // parallax shift in px
        });
    });

    // ── Overall section opacity: fade in at start, fade out at end ──
    const sectionOpacity = useTransform(scrollYProgress, (v: number) => {
        // Fade in during 0→0.08, full during 0.08→0.92, fade out during 0.92→1.0
        if (v < 0.08) return v / 0.08;
        if (v > 0.92) return (1 - v) / 0.08;
        return 1;
    });

    return (
        <section
            ref={sectionRef}
            className="relative"
            style={{ height: SECTION_HEIGHT }}
        >
            {/* ── Fixed canvas viewport — stays in place on screen ── */}
            <motion.div
                className="fixed inset-0 w-full overflow-hidden pointer-events-none"
                style={{
                    height: '100vh',
                    zIndex: 20,
                    opacity: sectionOpacity,
                    visibility: isInView ? 'visible' : 'hidden',
                }}
            >
                {/* Fade-in wrapper */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isVisible ? 1 : 0 }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0"
                >
                    {/* Canvas: fills viewport, transparent background */}
                    <canvas
                        ref={canvasRef}
                        className="w-full h-full"
                        style={{
                            display: 'block',
                            // Transparent canvas — the page bg (#050508) shows through
                            background: 'transparent',
                        }}
                    />
                </motion.div>

                {/* ── Text overlays: positioned above the hands animation ── */}
                {TEXT_OVERLAYS.map((overlay, i) => (
                    <motion.div
                        key={i}
                        className="absolute left-0 right-0 text-center px-6 pointer-events-none"
                        style={{
                            top: '10%',
                            opacity: overlayOpacities[i],
                            y: overlayYs[i],
                        }}
                    >
                        <h2
                            className="text-4xl md:text-5xl lg:text-6xl text-white drop-shadow-[0_0_40px_rgba(139,92,246,0.3)] leading-tight font-light tracking-wide"
                            style={{ fontFamily: "'Innovar', 'Cinzel Decorative', serif" }}
                            dangerouslySetInnerHTML={{ __html: overlay.text }}
                        />
                    </motion.div>
                ))}

                {/* ── Subtle gradient overlays for depth ── */}
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[var(--bg)] to-transparent pointer-events-none z-10" />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[var(--bg)] to-transparent pointer-events-none z-10" />
            </motion.div>
        </section>
    );
}
