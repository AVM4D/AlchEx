import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

/* ═══════════════════════════════════════════════════════════════════════════
   SmoothScroller — Premium Lenis-powered smooth scrolling
   
   Wraps children with Lenis for silky smooth inertial scrolling.
   Uses RAF loop for buttery 60fps interpolation.
   ═══════════════════════════════════════════════════════════════════════════ */

interface SmoothScrollerProps {
    children: React.ReactNode;
}

export default function SmoothScroller({ children }: SmoothScrollerProps) {
    const lenisRef = useRef<Lenis | null>(null);

    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,              // Luxurious momentum duration
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Expo decay
            smoothWheel: true,          // Smooth mouse wheel
            wheelMultiplier: 1,         // Natural wheel speed  
            touchMultiplier: 2,         // Responsive touch
        });

        lenisRef.current = lenis;

        // RAF loop — drives the smooth interpolation
        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        return () => {
            lenis.destroy();
            lenisRef.current = null;
        };
    }, []);

    return <>{children}</>;
}
