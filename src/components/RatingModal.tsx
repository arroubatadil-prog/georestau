import React, { useState } from 'react';
import { Star, X, Send } from 'lucide-react';
import { Order, Review } from '../types';
import { useI18n } from '../i18n';

interface RatingModalProps {
  order: Order;
  restaurantName: string;
  onSubmit: (review: Review) => void;
  onClose: () => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({ order, restaurantName, onSubmit, onClose }) => {
  const { t } = useI18n();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      alert(t('please_select_rating'));
      return;
    }

    setIsSubmitting(true);
    
    const review: Review = {
      id: `review-${Date.now()}`,
      restaurantId: order.restaurantId,
      clientId: order.clientId,
      clientName: order.clientName || 'Client',
      rating,
      comment: comment.trim() || undefined,
      timestamp: Date.now()
    };

    try {
      onSubmit(review);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la soumission du rating:', error);
      alert(t('error_submitting_review'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">{t('rate_your_experience')}</h2>
            <p className="text-orange-100 text-sm">{restaurantName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Rating Stars */}
          <div className="flex flex-col items-center space-y-4">
            <p className="text-gray-600 font-medium">{t('your_rating')}:</p>
            <div className="flex gap-4 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform duration-200 hover:scale-110"
                >
                  <Star
                    size={40}
                    className={`transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'fill-orange-400 text-orange-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <div className="text-sm font-medium text-orange-600">
                {rating === 1 && t('rating_disappointing')}
                {rating === 2 && t('rating_average')}
                {rating === 3 && t('rating_good')}
                {rating === 4 && t('rating_very_good')}
                {rating === 5 && t('rating_excellent')}
              </div>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">{t('comment_optional')}</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('share_your_experience')}
              className="w-full h-20 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none outline-none"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
              disabled={isSubmitting}
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={rating === 0 || isSubmitting}
              className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Send size={18} />
              {t('send')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
