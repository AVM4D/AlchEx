import { useRef, ReactNode } from 'react';
import { motion, useSpring, useTransform, MotionValue, MotionStyle } from 'framer-motion';

/*
 * Overdamped spring — snappy response, zero oscillation.
 * damping² > 4 * mass * stiffness → guaranteed no overshoot.
 */
const SPRING = { mass: 0.1, stiffness: 260, damping: 26 };

interface DockMagnifyItemProps {
  mousePos: MotionValue<number>;
  children: (iconScale: MotionStyle) => ReactNode;
  direction?: 'vertical' | 'horizontal';
  baseSize?: number;
  magnification?: number;
  distance?: number;
}

export function DockMagnifyItem({
  mousePos,
  children,
  direction = 'vertical',
  baseSize = 40,
  magnification = 56,
  distance = 140,
}: DockMagnifyItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  const mouseDistance = useTransform(mousePos, (val) => {
    const el = ref.current;
    if (!el) return distance + 1;
    const rect = el.getBoundingClientRect();
    return direction === 'vertical'
      ? val - rect.y - rect.height / 2
      : val - rect.x - rect.width / 2;
  });

  const scaleFactor = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [1, magnification / baseSize, 1],
  );

  const scale = useSpring(scaleFactor, SPRING);

  // Pass scale as a motion style so only the icon can use it
  const iconScale: MotionStyle = { scale };

  return (
    <div
      ref={ref}
      style={{
        width: baseSize,
        height: baseSize,
        flexShrink: 0,
      }}
      className="relative flex items-center justify-center"
    >
      {children(iconScale)}
    </div>
  );
}
