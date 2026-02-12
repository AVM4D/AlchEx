import React from 'react';
import { motion } from 'framer-motion';

interface MarqueeProps {
  children: React.ReactNode;
  speed?: number;
  direction?: 'left' | 'right';
  className?: string;
  pauseOnHover?: boolean;
}

export const Marquee: React.FC<MarqueeProps> = ({
  children,
  speed = 30,
  direction = 'left',
  className = '',
  pauseOnHover = true,
}) => {
  return (
    <div
      className={`overflow-hidden whitespace-nowrap ${pauseOnHover ? 'group' : ''} ${className}`}
    >
      <motion.div
        className={`inline-flex ${pauseOnHover ? 'group-hover:[animation-play-state:paused]' : ''}`}
        animate={{
          x: direction === 'left' ? ['0%', '-50%'] : ['-50%', '0%'],
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: 'loop',
            duration: speed,
            ease: 'linear',
          },
        }}
      >
        {children}
        {children}
      </motion.div>
    </div>
  );
};
