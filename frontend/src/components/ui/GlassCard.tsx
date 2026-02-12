import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  gradient?: boolean;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children, className, hover = false, glow = false, gradient = false, onClick,
}) => {
  return (
    <motion.div
      whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={cn(
        'rounded-2xl backdrop-blur-xl border',
        'bg-surface/40 border-white/5',
        hover && 'cursor-pointer transition-all duration-300 hover:border-primary/20 hover:shadow-glow',
        glow && 'shadow-glow',
        gradient && 'gradient-border',
        className
      )}
    >
      {children}
    </motion.div>
  );
};
