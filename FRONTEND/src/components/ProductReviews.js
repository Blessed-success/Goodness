/**
 * ProductReviews
 * Star-rating submission form + existing review list for a single product.
 * Mounted inside QuickViewModal, the current de-facto product detail view.
 */

import React, { useEffect, useState } from 'react';
import { FiStar } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { reviewsAPI } from '../api';
import Badge from './ui/Badge';
import Button from './ui/Button';
import { toast } from './ui/Toast';

const StarPicker = ({ value, onChange }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((n) => (
      <button key={n} type="button" onClick={() => onChange(n)} className="text-amber-400">
        <FiStar size={20} fill={n <= value ? '#fbbf24' : 'none'} />
      </button>
    ))}
  </div>
);

const ProductReviews = ({ productId }) => {
  const { isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = () => {
    setLoading(true);
    reviewsAPI
      .getForProduct(productId)
      .then((response) => setReviews(response.data.data.reviews))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating < 1) {
      toast.error('Please select a star rating');
      return;
    }
    try {
      setSubmitting(true);
      await reviewsAPI.submit({ product_id: productId, rating, body });
      toast.success('Review submitted');
      setRating(0);
      setBody('');
      fetchReviews();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-6 border-t border-gray-100 pt-6">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">Customer Reviews</h3>

      {isAuthenticated && (
        <form onSubmit={handleSubmit} className="mb-6 space-y-3">
          <StarPicker value={rating} onChange={setRating} />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your experience with this product..."
            rows={2}
            className="w-full rounded-lg border border-gray-200 p-2 text-sm focus:border-primary-400 focus:outline-none"
          />
          <Button type="submit" size="sm" loading={submitting}>
            Submit Review
          </Button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Loading reviews&hellip;</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-400">No reviews yet — be the first to review this product.</p>
      ) : (
        <div className="max-h-56 space-y-4 overflow-y-auto pr-1">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-50 pb-3 last:border-0">
              <div className="mb-1 flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <FiStar key={n} size={12} className="text-amber-400" fill={n <= review.rating ? '#fbbf24' : 'none'} />
                  ))}
                </div>
                <span className="text-xs font-semibold text-gray-700">{review.username}</span>
                {review.is_verified_purchase && <Badge variant="success">Verified Purchase</Badge>}
              </div>
              {review.body && <p className="text-sm text-gray-600">{review.body}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductReviews;
