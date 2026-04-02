import React from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating?: number;
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

export const RatingStars: React.FC<RatingStarsProps> = ({ 
  rating = 0, 
  count = 0, 
  size = 'md',
  showCount = true 
}) => {
  const sizeMap = {
    sm: 12,
    md: 16,
    lg: 20
  };

  const starSize = sizeMap[size];
  const displayRating = Math.round(rating * 10) / 10;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={starSize}
            className={`${
              star <= Math.round(displayRating)
                ? 'fill-orange-400 text-orange-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
      {showCount && (
        <div className="text-xs font-medium text-gray-600 ml-1">
          {displayRating > 0 ? displayRating.toFixed(1) : 'N/A'}
          {count > 0 && <span className="text-gray-400"> ({count})</span>}
        </div>
      )}
    </div>
  );
};
