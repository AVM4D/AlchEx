import React from 'react';
import { cn } from '../../lib/utils';
import './RippleGrid.css';

interface RippleGridProps {
  className?: string;
  style?: React.CSSProperties;
  gridSize?: number;
  gridLineColor?: string;
  rippleColor?: string;
  rippleDuration?: number;
}

export const RippleGrid: React.FC<RippleGridProps> = ({
  className,
  style,
  gridSize = 64,
  gridLineColor = 'rgba(255, 255, 255, 0.08)',
  rippleColor = 'var(--accent-glow)',
  rippleDuration = 9,
}) => {
  const cssVars = {
    '--rg-grid-size': `${gridSize}px`,
    '--rg-grid-line': gridLineColor,
    '--rg-ripple-color': rippleColor,
    '--rg-ripple-duration': `${rippleDuration}s`,
  } as React.CSSProperties;

  return (
    <div
      className={cn('ripple-grid', className)}
      style={{ ...cssVars, ...style }}
      aria-hidden="true"
    >
      <div className="ripple-grid__lines" />
      <div className="ripple-grid__ripples">
        <span className="ripple-grid__ring ripple-grid__ring--1" />
        <span className="ripple-grid__ring ripple-grid__ring--2" />
        <span className="ripple-grid__ring ripple-grid__ring--3" />
      </div>
    </div>
  );
};

export default RippleGrid;