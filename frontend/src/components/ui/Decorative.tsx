import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface AnimatedCounterProps {
  value: number | string;
  suffix?: string;
  prefix?: string;
  className?: string;
  delay?: number;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  suffix = '',
  prefix = '',
  className,
  delay = 0,
}) => {
  return (
    <motion.span
      className={cn('tabular-nums', className)}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
    >
      {prefix}{value}{suffix}
    </motion.span>
  );
};

interface GlowingOrbProps {
  className?: string;
  color?: string;
  size?: number;
  blur?: number;
  animate?: boolean;
}

export const GlowingOrb: React.FC<GlowingOrbProps> = ({
  className = '',
  color = 'rgba(139, 92, 246, 0.4)',
  size = 300,
  blur = 100,
  animate = true,
}) => {
  return (
    <motion.div
      className={`absolute rounded-full pointer-events-none ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: `blur(${blur}px)`,
      }}
      animate={animate ? {
        scale: [1, 1.2, 1],
        opacity: [0.4, 0.7, 0.4],
      } : undefined}
      transition={animate ? {
        duration: 8,
        repeat: Infinity,
        ease: 'easeInOut',
      } : undefined}
    />
  );
};

interface FloatingElementProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  distance?: number;
  delay?: number;
}

export const FloatingElement: React.FC<FloatingElementProps> = ({
  children,
  className = '',
  duration = 6,
  distance = 20,
  delay = 0,
}) => {
  return (
    <motion.div
      className={className}
      animate={{
        y: [-distance / 2, distance / 2, -distance / 2],
        rotate: [-2, 2, -2],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
    >
      {children}
    </motion.div>
  );
};

interface SplitLineProps {
  className?: string;
  animated?: boolean;
}

export const SplitLine: React.FC<SplitLineProps> = ({
  className = '',
  animated = true,
}) => {
  return (
    <motion.div
      className={cn('h-px w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent', className)}
      initial={animated ? { scaleX: 0 } : undefined}
      whileInView={animated ? { scaleX: 1 } : undefined}
      viewport={{ once: true }}
      transition={{ duration: 1, ease: 'easeOut' }}
    />
  );
};

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  from?: string;
  via?: string;
  to?: string;
}

export const GradientText: React.FC<GradientTextProps> = ({
  children,
  className = '',
  from = '#7C3AED',
  via = '#A78BFA',
  to = '#C4B5FD',
}) => {
  return (
    <span
      className={`bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: `linear-gradient(135deg, ${from}, ${via}, ${to})`,
      }}
    >
      {children}
    </span>
  );
};

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
  rowSpan?: number;
}

export const BentoCard: React.FC<BentoCardProps> = ({
  children,
  className = '',
  colSpan = 1,
  rowSpan = 1,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        'group relative rounded-3xl overflow-hidden',
        'bg-white/[0.03] backdrop-blur-sm border border-white/[0.05]',
        'hover:border-primary/20 hover:bg-white/[0.06]',
        'transition-colors duration-500',
        className
      )}
      style={{
        gridColumn: `span ${colSpan}`,
        gridRow: `span ${rowSpan}`,
      }}
    >
      {/* Hover gradient */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
      </div>
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  );
};
