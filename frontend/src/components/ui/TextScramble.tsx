import React, { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '../../lib/utils';

interface TextScrambleProps {
    text: string;
    className?: string;
    speed?: number;
    trigger?: 'mount' | 'inView' | 'hover';
    scrambleChars?: string;
    delay?: number;
}

export const TextScramble: React.FC<TextScrambleProps> = ({
    text,
    className,
    speed = 30,
    trigger = 'inView',
    scrambleChars = '!<>-_\\/[]{}—=+*^?#________',
    delay = 0,
}) => {
    const [displayText, setDisplayText] = useState(trigger === 'mount' ? '' : text);
    const [hasTriggered, setHasTriggered] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);
    const frameRef = useRef<number>(0);
    const queueRef = useRef<Array<{ from: string; to: string; start: number; end: number; char?: string }>>([]);

    const scramble = useCallback(() => {
        const oldText = '';
        const newText = text;
        const length = Math.max(oldText.length, newText.length);
        const queue: typeof queueRef.current = [];

        for (let i = 0; i < length; i++) {
            const from = oldText[i] || '';
            const to = newText[i] || '';
            const start = Math.floor(Math.random() * 40);
            const end = start + Math.floor(Math.random() * 40);
            queue.push({ from, to, start, end });
        }
        queueRef.current = queue;

        let frame = 0;
        const update = () => {
            let output = '';
            let complete = 0;

            for (let i = 0; i < queueRef.current.length; i++) {
                const item = queueRef.current[i];
                const { from, to, start, end } = item;

                if (frame >= end) {
                    complete++;
                    output += to;
                } else if (frame >= start) {
                    if (!item.char || Math.random() < 0.28) {
                        item.char = scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
                    }
                    output += item.char;
                } else {
                    output += from;
                }
            }

            setDisplayText(output);

            if (complete === queueRef.current.length) {
                return;
            }

            frameRef.current = requestAnimationFrame(update);
            frame++;
        };

        frameRef.current = requestAnimationFrame(update);
    }, [text, scrambleChars]);

    // InView trigger
    useEffect(() => {
        if (trigger !== 'inView') return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasTriggered) {
                    setHasTriggered(true);
                    setTimeout(() => scramble(), delay);
                    observer.disconnect();
                }
            },
            { threshold: 0.3 }
        );

        if (ref.current) observer.observe(ref.current);
        return () => {
            observer.disconnect();
            cancelAnimationFrame(frameRef.current);
        };
    }, [trigger, hasTriggered, scramble, delay]);

    // Mount trigger
    useEffect(() => {
        if (trigger !== 'mount') return;
        const timer = setTimeout(() => scramble(), delay);
        return () => {
            clearTimeout(timer);
            cancelAnimationFrame(frameRef.current);
        };
    }, [trigger, scramble, delay]);

    const handleMouseEnter = () => {
        if (trigger === 'hover') {
            scramble();
        }
    };

    return (
        <span
            ref={ref}
            className={cn('inline-block', className)}
            onMouseEnter={handleMouseEnter}
            style={{ minWidth: `${text.length}ch` }}
        >
            {displayText}
        </span>
    );
};
