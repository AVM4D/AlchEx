import React from 'react';
import { cn } from '../../lib/utils';
import { getInitials } from '../../lib/utils';

interface AvatarProps {
  src?: string;
  firstName: string;
  lastName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  glow?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  src, firstName, lastName, size = 'md', className, glow = false,
}) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
  };

  return (
    <div className={cn(
      'rounded-full flex items-center justify-center font-semibold shrink-0',
      'bg-gradient-to-br from-primary-dark to-primary text-white',
      sizes[size],
      glow && 'shadow-glow ring-2 ring-primary/30',
      className
    )}>
      {src ? (
        <img
          src={src}
          alt={`${firstName} ${lastName}`}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        getInitials(firstName, lastName)
      )}
    </div>
  );
};
