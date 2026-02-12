import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating, maxRating = 5, size = 18, interactive = false, onChange, className,
}) => {
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: maxRating }, (_, i) => (
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(i + 1)}
          className={cn(
            'transition-all duration-200',
            interactive && 'cursor-pointer hover:scale-110',
            !interactive && 'cursor-default'
          )}
        >
          <Star
            size={size}
            className={cn(
              i < rating
                ? 'text-primary fill-primary'
                : 'text-gray-600'
            )}
          />
        </button>
      ))}
    </div>
  );
};
