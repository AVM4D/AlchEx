import React, { useEffect, useCallback } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export const CustomCursor: React.FC = () => {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springConfig = { damping: 25, stiffness: 700 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);
  const isHovering = useMotionValue(0);
  const isClicking = useMotionValue(0);
  const scale = useSpring(1, { damping: 20, stiffness: 400 });

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX - 16);
      cursorY.set(e.clientY - 16);
    };

    // Use event delegation instead of MutationObserver — no DOM thrashing
    const handleOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target?.closest?.('a, button, [role="button"], input, select, textarea')) {
        isHovering.set(1);
        scale.set(2);
      }
    };
    const handleOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target?.closest?.('a, button, [role="button"], input, select, textarea')) {
        isHovering.set(0);
        scale.set(1);
      }
    };
    const handleMouseDown = () => { isClicking.set(1); scale.set(0.8); };
    const handleMouseUp = () => { isClicking.set(0); scale.set(isHovering.get() ? 2 : 1); };

    window.addEventListener('mousemove', moveCursor, { passive: true });
    document.addEventListener('mouseover', handleOver, { passive: true });
    document.addEventListener('mouseout', handleOut, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      document.removeEventListener('mouseover', handleOver);
      document.removeEventListener('mouseout', handleOut);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <>
      {/* Outer ring */}
      <motion.div
        className="fixed top-0 left-0 z-[99999] pointer-events-none hidden lg:block"
        style={{ x: cursorXSpring, y: cursorYSpring }}
      >
        <motion.div
          className="w-8 h-8 rounded-full border border-white/60"
          style={{ scale }}
          transition={{ duration: 0.15 }}
        />
      </motion.div>
      {/* Inner dot */}
      <motion.div
        className="fixed top-0 left-0 z-[99999] pointer-events-none hidden lg:block"
        style={{ x: cursorX, y: cursorY }}
      >
        <div className="w-8 h-8 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
        </div>
      </motion.div>
    </>
  );
};
