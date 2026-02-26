import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { cn } from '../../lib/utils';

gsap.registerPlugin(ScrollTrigger);

type RevealType = 'fadeUp' | 'fadeIn' | 'scaleIn' | 'slideLeft' | 'slideRight' | 'clipUp';

interface GsapRevealProps {
    children: React.ReactNode;
    className?: string;
    type?: RevealType;
    delay?: number;
    duration?: number;
    stagger?: number;
    triggerStart?: string;
    once?: boolean;
}

const getInitialProps = (type: RevealType) => {
    switch (type) {
        case 'fadeUp':
            return { opacity: 0, y: 60 };
        case 'fadeIn':
            return { opacity: 0 };
        case 'scaleIn':
            return { opacity: 0, scale: 0.9 };
        case 'slideLeft':
            return { opacity: 0, x: 80 };
        case 'slideRight':
            return { opacity: 0, x: -80 };
        case 'clipUp':
            return { opacity: 0, y: 40, clipPath: 'inset(100% 0% 0% 0%)' };
        default:
            return { opacity: 0, y: 60 };
    }
};

const getAnimateProps = (type: RevealType) => {
    switch (type) {
        case 'fadeUp':
            return { opacity: 1, y: 0 };
        case 'fadeIn':
            return { opacity: 1 };
        case 'scaleIn':
            return { opacity: 1, scale: 1 };
        case 'slideLeft':
            return { opacity: 1, x: 0 };
        case 'slideRight':
            return { opacity: 1, x: 0 };
        case 'clipUp':
            return { opacity: 1, y: 0, clipPath: 'inset(0% 0% 0% 0%)' };
        default:
            return { opacity: 1, y: 0 };
    }
};

export const GsapReveal: React.FC<GsapRevealProps> = ({
    children,
    className,
    type = 'fadeUp',
    delay = 0,
    duration = 0.8,
    stagger = 0,
    triggerStart = 'top 85%',
    once = true,
}) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const targets = stagger > 0 ? el.children : el;
        const initial = getInitialProps(type);

        gsap.set(targets, initial);

        const anim = gsap.to(targets, {
            ...getAnimateProps(type),
            duration,
            delay,
            stagger: stagger > 0 ? stagger : undefined,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: el,
                start: triggerStart,
                toggleActions: once ? 'play none none none' : 'play reverse play reverse',
            },
        });

        return () => {
            anim.kill();
            ScrollTrigger.getAll().forEach((t) => {
                if (t.trigger === el) t.kill();
            });
        };
    }, [type, delay, duration, stagger, triggerStart, once]);

    return (
        <div ref={ref} className={cn(className)}>
            {children}
        </div>
    );
};
