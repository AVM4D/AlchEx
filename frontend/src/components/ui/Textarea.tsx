import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-gray-300">{label}</label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full rounded-xl bg-surface border border-border px-4 py-3 text-[var(--text)] placeholder-gray-500',
            'transition-all duration-200 resize-none min-h-[100px]',
            'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50',
            'hover:border-border-light',
            error && 'border-danger/50',
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
