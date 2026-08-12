/**
 * Product Card Component
 * Displays individual product with image, price, discount, rating, and action buttons
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiShoppingCart, FiHeart, FiMessageCircle, FiStar, FiEye, FiRepeat } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useCompare } from '../context/CompareContext';
import { paymentAPI } from '../api';
import Card from './ui/Card';
import Badge from './ui/Badge';
import Button from './ui/Button';
import PlaceholderImage from './ui/PlaceholderImage';
import { toast } from './ui/Toast';
import QuickViewModal from './QuickViewModal';

const ProductCard = ({ product, isBestDeal = false }) => {
  const { addItem } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { isWishlisted, toggleItem } = useWishlist();
  const { isComparing, toggleCompare, isFull } = useCompare();
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const handleAddToCart = async () => {
    try {
      setLoading(true);
      await addItem(product.id, quantity);
      toast.success('Added to cart');
      setQuantity(1);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppOrder = async () => {
    try {
      setLoading(true);
      const response = await paymentAPI.whatsappOrder({
        product_id: product.id,
        quantity,
        customer_name: user?.full_name || 'Customer',
        customer_phone: user?.phone || '',
      });

      window.open(response.data.data.whatsapp_url, '_blank');
      setQuantity(1);
    } catch (error) {
      toast.error(`Failed to open WhatsApp: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to save items to your wishlist');
      return;
    }
    try {
      await toggleItem(product.id);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleToggleCompare = () => {
    if (!isComparing(product.id) && isFull) {
      toast.error('You can compare up to 4 products at a time');
      return;
    }
    toggleCompare(product.id);
  };

  const liked = isWishlisted(product.id);
  const comparing = isComparing(product.id);
  const discountedPrice = product.discounted_price || product.price;
  const savings = ((product.price - discountedPrice) / product.price * 100).toFixed(0);

  return (
    <Card hoverable padded={false} className="group overflow-hidden">
      {/* Product Image */}
      <div className="relative h-32 overflow-hidden bg-gray-100 sm:h-40 md:h-48">
        <PlaceholderImage
          src={product.image_url}
          alt={product.name}
          className="h-full w-full object-cover transition duration-300 hover:scale-105"
        />

        {/* Badges */}
        <div className="absolute left-1.5 top-1.5 flex flex-col gap-1 sm:left-3 sm:top-3 sm:gap-1.5">
          {isBestDeal && <Badge variant="dark">Best Deal</Badge>}
          {product.is_flash_sale && <Badge variant="danger">Flash Sale</Badge>}
          {product.is_trending && <Badge variant="warning">Trending</Badge>}
          {product.discount_percent > 0 && <Badge variant="success">-{product.discount_percent}%</Badge>}
        </div>

        {/* Wishlist + Compare Buttons */}
        <div className="absolute right-1.5 top-1.5 flex flex-col gap-1 sm:right-3 sm:top-3 sm:gap-1.5">
          <button
            onClick={handleToggleWishlist}
            title="Save to wishlist"
            className="rounded-full bg-white/90 p-1.5 shadow-sm hover:bg-white transition-colors sm:p-2"
          >
            <FiHeart size={14} className="sm:hidden" fill={liked ? '#ef4444' : 'none'} color={liked ? '#ef4444' : '#6b7280'} />
            <FiHeart size={16} className="hidden sm:block" fill={liked ? '#ef4444' : 'none'} color={liked ? '#ef4444' : '#6b7280'} />
          </button>
          <button
            onClick={handleToggleCompare}
            title="Add to compare"
            className={`rounded-full p-1.5 shadow-sm transition-colors sm:p-2 ${
              comparing ? 'bg-primary-600 text-white' : 'bg-white/90 text-gray-600 hover:bg-white'
            }`}
          >
            <FiRepeat size={14} className="sm:hidden" />
            <FiRepeat size={16} className="hidden sm:block" />
          </button>
        </div>

        {/* Quick View */}
        <button
          onClick={() => setQuickViewOpen(true)}
          className="absolute inset-x-2 bottom-2 flex translate-y-2 items-center justify-center gap-1.5 rounded-lg bg-white/95 py-1.5 text-[11px] font-semibold text-primary-800 opacity-0 shadow-sm transition-all duration-200 hover:bg-white group-hover:translate-y-0 group-hover:opacity-100 sm:inset-x-3 sm:bottom-3 sm:py-2 sm:text-xs"
        >
          <FiEye size={14} /> Quick View
        </button>
      </div>

      {/* Product Info */}
      <div className="p-2.5 sm:p-4">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400 sm:mb-1.5 sm:text-xs">
          {product.category}
        </p>

        {product.vendor_id && (
          <Link
            to={`/store/${product.vendor_slug}`}
            onClick={(e) => e.stopPropagation()}
            className="mb-1 block text-[10px] font-medium text-primary-600 hover:underline sm:mb-1.5 sm:text-xs"
          >
            Sold by {product.vendor_name}
          </Link>
        )}

        <h3 className="mb-1.5 line-clamp-2 text-sm font-semibold text-gray-900 hover:text-primary-600 sm:mb-2 sm:text-base">
          {product.name}
        </h3>

        <div className="mb-2 flex items-center gap-1 text-xs sm:mb-3 sm:text-sm">
          <FiStar className="text-amber-400" fill="#fbbf24" size={14} />
          <span className="font-medium text-gray-700">{product.rating}</span>
        </div>

        <div className="mb-2 sm:mb-3">
          <div className="flex flex-wrap items-baseline gap-1 sm:gap-2">
            <span className="text-base font-bold text-gray-900 sm:text-xl">GHS {discountedPrice.toFixed(2)}</span>
            {product.discount_percent > 0 && (
              <span className="text-xs text-gray-400 line-through sm:text-sm">GHS {product.price.toFixed(2)}</span>
            )}
          </div>
          {product.discount_percent > 0 && (
            <p className="text-xs font-medium text-green-600 sm:text-sm">
              Save GHS {(product.price - discountedPrice).toFixed(2)} ({savings}%)
            </p>
          )}
        </div>

        <div className="mb-2 sm:mb-3">
          {product.stock_quantity > 10 ? (
            <span className="text-xs font-medium text-green-600 sm:text-sm">In Stock</span>
          ) : product.stock_quantity > 0 ? (
            <span className="text-xs font-medium text-amber-600 sm:text-sm">Only {product.stock_quantity} left</span>
          ) : (
            <span className="text-xs font-medium text-red-500 sm:text-sm">Out of Stock</span>
          )}
        </div>

        <div className="mb-2 flex items-center gap-1 sm:mb-3 sm:gap-2">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={product.stock_quantity === 0}
            className="rounded-lg border border-gray-200 px-2 py-1 text-gray-600 hover:bg-gray-50 disabled:opacity-50 sm:px-2.5"
          >
            &minus;
          </button>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            min="1"
            max={product.stock_quantity}
            className="w-10 rounded-lg border border-gray-200 py-1 text-center text-sm sm:w-12"
            disabled={product.stock_quantity === 0}
          />
          <button
            onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
            disabled={product.stock_quantity === 0}
            className="rounded-lg border border-gray-200 px-2 py-1 text-gray-600 hover:bg-gray-50 disabled:opacity-50 sm:px-2.5"
          >
            +
          </button>
        </div>

        <div className="space-y-1.5 sm:space-y-2">
          <Button
            size="sm"
            onClick={handleAddToCart}
            disabled={product.stock_quantity === 0}
            loading={loading}
            fullWidth
            className="text-xs sm:text-sm"
          >
            <FiShoppingCart size={14} />
            <span className="truncate">Add to Cart</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleWhatsAppOrder}
            disabled={loading}
            fullWidth
            className="border-green-200 text-xs text-green-700 hover:bg-green-50 sm:text-sm"
            title="Send product details to WhatsApp for direct quote"
          >
            <FiMessageCircle size={14} />
            <span className="truncate">WhatsApp Order</span>
          </Button>
        </div>
      </div>

      {quickViewOpen && (
        <QuickViewModal product={product} onClose={() => setQuickViewOpen(false)} />
      )}
    </Card>
  );
};

export default ProductCard;
