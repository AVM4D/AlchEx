import React, { useRef, useEffect, useState } from 'react';
import { cn } from '../../lib/utils';

interface AnimatedGradientBorderProps {
    children: React.ReactNode;
    className?: string;
    borderWidth?: number;
    borderRadius?: number;
    gradientColors?: string[];
    speed?: number;
    glowOnHover?: boolean;
}

export const AnimatedGradientBorder: React.FC<AnimatedGradientBorderProps> = ({
    children,
    className,
    borderWidth = 1,
    borderRadius = 16,
    gradientColors = ['rgba(255, 255, 255,0.6)', 'rgba(167,139,250,0.3)', 'transparent', 'var(--accent-sub)', 'rgba(196,181,253,0.4)', 'transparent'],
    speed = 3,
    glowOnHover = true,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [angle, setAngle] = useState(0);
    const frameRef = useRef<number>(0);

    useEffect(() => {
        let lastTime = 0;
        const animate = (time: number) => {
            if (lastTime) {
                const delta = time - lastTime;
                setAngle((prev) => (prev + (delta * speed * 0.06)) % 360);
            }
            lastTime = time;
            frameRef.current = requestAnimationFrame(animate);
        };

        frameRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameRef.current);
    }, [speed]);

    const gradientStr = gradientColors.join(', ');
    const borderGradient = `conic-gradient(from ${angle}deg, ${gradientStr})`;

    return (
        <div
            ref={containerRef}
            className={cn('relative group', className)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ borderRadius }}
        >
            {/* Gradient border layer */}
            <div
                className="absolute -inset-px rounded-[inherit] transition-opacity duration-500"
                style={{
                    background: borderGradient,
                    opacity: isHovered ? 1 : 0.4,
                    borderRadius: borderRadius + 1,
                }}
            />

            {/* Glow layer */}
            {glowOnHover && (
                <div
                    className="absolute -inset-1 rounded-[inherit] blur-md transition-opacity duration-700"
                    style={{
                        background: borderGradient,
                        opacity: isHovered ? 0.3 : 0,
                        borderRadius: borderRadius + 4,
                    }}
                />
            )}

            {/* Inner content */}
            <div
                className="relative rounded-[inherit] bg-[var(--surface)] overflow-hidden"
                style={{
                    margin: borderWidth,
                    borderRadius: borderRadius - borderWidth,
                }}
            >
                {children}
            </div>
        </div>
    );
};
