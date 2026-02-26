import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
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
const TOTAL_FRAMES = 318;           // 60fps extracted frame count
const FRAME_PATH = '/frames/hands'; // Relative to /public
const PRELOAD_BATCH = 50;           // Preload first N frames immediately
const LERP_FACTOR = 0.18;           // Responsive enough to hit every frame
const SECTION_HEIGHT = '700vh';     // ~10px per frame per half — every frame visible

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

// ───── Utility: parse HTML into character metadata ─────
interface CharMeta {
    char: string;
    className?: string;
    style?: React.CSSProperties;
}

function parseToChars(html: string): CharMeta[] {
    const div = document.createElement('div');
    div.innerHTML = html;
    const chars: CharMeta[] = [];

    function walk(node: Node, cls?: string, style?: React.CSSProperties) {
        if (node.nodeType === Node.TEXT_NODE) {
            for (const c of (node.textContent || '')) {
                chars.push({ char: c, className: cls, style });
            }
        } else if (node instanceof HTMLElement) {
            const newCls = node.className || cls;
            let newStyle = style;
            const raw = node.getAttribute('style');
            if (raw) {
                const parsed: Record<string, string> = {};
                raw.split(';').forEach(s => {
                    const idx = s.indexOf(':');
                    if (idx > 0) {
                        const key = s.slice(0, idx).trim();
                        const val = s.slice(idx + 1).trim();
                        const camel = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
                        parsed[camel] = val;
                    }
                });
                newStyle = { ...style, ...parsed };
            }
            node.childNodes.forEach(child => walk(child, newCls, newStyle));
        }
    }

    div.childNodes.forEach(child => walk(child));
    return chars;
}

// ───── TypewriterText: per-character reveal driven by MotionValue ─────
import type { MotionValue } from 'framer-motion';

interface TypewriterTextProps {
    html: string;
    reveal: MotionValue<number>;
    className?: string;
    fontStyle?: React.CSSProperties;
}

function TypewriterText({ html, reveal, className, fontStyle }: TypewriterTextProps) {
    const containerRef = useRef<HTMLHeadingElement>(null);
    const chars = useMemo(() => parseToChars(html), [html]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const spans = container.querySelectorAll<HTMLSpanElement>('[data-ci]');
        if (!spans.length) return;

        const unsubscribe = reveal.on('change', (v) => {
            const total = spans.length;
            const revealed = v * total;
            const floor = Math.floor(revealed);
            const frac = revealed - floor;

            for (let i = 0; i < total; i++) {
                if (i < floor) {
                    spans[i].style.opacity = '1';
                } else if (i === floor) {
                    spans[i].style.opacity = String(frac);
                } else {
                    spans[i].style.opacity = '0';
                }
            }
        });

        return unsubscribe;
    }, [reveal, chars.length]);

    return (
        <h2 ref={containerRef} className={className} style={fontStyle}>
            {chars.map((c, i) => (
                <span
                    key={i}
                    data-ci={i}
                    className={c.className}
                    style={{ ...c.style, opacity: 0 }}
                >
                    {c.char === ' ' ? '\u00A0' : c.char}
                </span>
            ))}
        </h2>
    );
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
    // Scroll 0→0.5: forward  frame 0 → lastFrame
    // Scroll 0.5→1: reverse  lastFrame → frame 0
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

    // ── Compute text overlay reveal (typewriter clip) based on scroll ──
    // Returns 0→1 where 0 = fully hidden, 1 = fully revealed
    const overlayReveals = TEXT_OVERLAYS.map((overlay) => {
        const [start, end] = overlay.range;
        const duration = end - start;
        const typeInEnd = start + duration * 0.6;   // first 60%: type in
        const holdEnd = start + duration * 0.8;     // middle 20%: hold
        // last 20%: type out
        // eslint-disable-next-line react-hooks/rules-of-hooks
        return useTransform(scrollYProgress, (v: number) => {
            if (v < start || v > end) return 0;
            if (v <= typeInEnd) {
                // Type in: 0→1
                return clamp((v - start) / (typeInEnd - start), 0, 1);
            }
            if (v <= holdEnd) {
                // Hold fully visible
                return 1;
            }
            // Type out: 1→0
            return clamp(1 - (v - holdEnd) / (end - holdEnd), 0, 1);
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


    // ── Overall section opacity: fade in at start, stays visible at end ──
    const sectionOpacity = useTransform(scrollYProgress, (v: number) => {
        // Fade in during 0→0.08, fully visible for the rest
        if (v < 0.08) return v / 0.08;
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

                {/* ── Text overlays: character-by-character typewriter ── */}
                {TEXT_OVERLAYS.map((overlay, i) => (
                    <motion.div
                        key={i}
                        className="absolute left-0 right-0 text-center px-6 pointer-events-none"
                        style={{
                            top: '10%',
                            y: overlayYs[i],
                        }}
                    >
                        <TypewriterText
                            html={overlay.text}
                            reveal={overlayReveals[i]}
                            className="text-4xl md:text-5xl lg:text-6xl text-white drop-shadow-[0_0_40px_rgba(139,92,246,0.3)] leading-tight font-light tracking-wide"
                            fontStyle={{ fontFamily: "'Innovar', 'Cinzel Decorative', serif" }}
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
