import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ═══════════════════════════════════════════════════════════════════════════
   SmoothScroller — Butter-smooth Lenis + GSAP ScrollTrigger integration

   • Lenis drives inertial scrolling (lerp-based, no duration lag)
   • GSAP ticker drives Lenis so ScrollTrigger stays perfectly in sync
   • Framer Motion useScroll works because Lenis updates native scrollY
   ═══════════════════════════════════════════════════════════════════════════ */

interface SmoothScrollerProps {
    children: React.ReactNode;
}

export default function SmoothScroller({ children }: SmoothScrollerProps) {
    const lenisRef = useRef<Lenis | null>(null);

    useEffect(() => {
        const lenis = new Lenis({
            lerp: 0.08,                 // Interpolation factor — lower = silkier
            smoothWheel: true,
            wheelMultiplier: 1.2,       // Slightly snappier wheel response
            touchMultiplier: 1.5,       // Natural touch feel
            infinite: false,
        });

        lenisRef.current = lenis;

        // ── Sync Lenis with GSAP's ticker so ScrollTrigger stays in lockstep ──
        // This replaces the manual RAF loop and prevents double-timing issues.
        lenis.on('scroll', ScrollTrigger.update);

        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });

        // Disable GSAP's built-in lag smoothing so it doesn't fight Lenis
        gsap.ticker.lagSmoothing(0);

        return () => {
            lenis.off('scroll', ScrollTrigger.update);
            gsap.ticker.remove((time) => lenis.raf(time * 1000));
            lenis.destroy();
            lenisRef.current = null;
        };
    }, []);

    return <>{children}</>;
}
