import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface MouseRevealProps {
    /** The visible top-layer text */
    frontText: string;
    /** The hidden text revealed on hover */
    backText: string;
    className?: string;
    revealSize?: number;
}

export const MouseReveal: React.FC<MouseRevealProps> = ({
    frontText,
    backText,
    className = '',
    revealSize = 120,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const maskRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        const mask = maskRef.current;
        if (!container || !mask) return;

        const onMove = (e: MouseEvent) => {
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            gsap.to(mask, {
                '--mx': `${x}px`,
                '--my': `${y}px`,
                duration: 0.3,
                ease: 'power2.out',
            });
        };

        const onEnter = () => {
            gsap.to(mask, { '--size': `${revealSize}px`, duration: 0.4, ease: 'power2.out' });
        };

        const onLeave = () => {
            gsap.to(mask, { '--size': '0px', duration: 0.3, ease: 'power2.in' });
        };

        container.addEventListener('mousemove', onMove);
        container.addEventListener('mouseenter', onEnter);
        container.addEventListener('mouseleave', onLeave);

        return () => {
            container.removeEventListener('mousemove', onMove);
            container.removeEventListener('mouseenter', onEnter);
            container.removeEventListener('mouseleave', onLeave);
        };
    }, [revealSize]);

    return (
        <div
            ref={containerRef}
            className={`relative cursor-crosshair overflow-hidden ${className}`}
            style={{ userSelect: 'none' }}
        >
            {/* Front text — always visible */}
            <div className="pointer-events-none">
                {frontText}
            </div>
            {/* Back text — revealed by mouse mask */}
            <div
                ref={maskRef}
                className="absolute inset-0 pointer-events-none text-[var(--accent)] flex items-center"
                style={{
                    '--mx': '-999px',
                    '--my': '-999px',
                    '--size': '0px',
                    WebkitMaskImage: 'radial-gradient(circle var(--size) at var(--mx) var(--my), black 80%, transparent 100%)',
                    maskImage: 'radial-gradient(circle var(--size) at var(--mx) var(--my), black 80%, transparent 100%)',
                } as React.CSSProperties}
            >
                {backText}
            </div>
        </div>
    );
};
