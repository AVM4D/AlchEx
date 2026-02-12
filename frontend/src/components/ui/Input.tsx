import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-gray-300">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full rounded-xl bg-surface border border-border px-4 py-2.5 text-white placeholder-gray-500',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50',
              'hover:border-border-light',
              icon && 'pl-10',
              error && 'border-danger/50 focus:ring-danger/50',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
