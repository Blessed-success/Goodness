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
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <PlaceholderImage
          src={product.image_url}
          alt={product.name}
          className="h-full w-full object-cover transition duration-300 hover:scale-105"
        />

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {isBestDeal && <Badge variant="dark">Best Deal</Badge>}
          {product.is_flash_sale && <Badge variant="danger">Flash Sale</Badge>}
          {product.is_trending && <Badge variant="warning">Trending</Badge>}
          {product.discount_percent > 0 && <Badge variant="success">-{product.discount_percent}%</Badge>}
        </div>

        {/* Wishlist + Compare Buttons */}
        <div className="absolute right-3 top-3 flex flex-col gap-1.5">
          <button
            onClick={handleToggleWishlist}
            title="Save to wishlist"
            className="rounded-full bg-white/90 p-2 shadow-sm hover:bg-white transition-colors"
          >
            <FiHeart size={16} fill={liked ? '#ef4444' : 'none'} color={liked ? '#ef4444' : '#6b7280'} />
          </button>
          <button
            onClick={handleToggleCompare}
            title="Add to compare"
            className={`rounded-full p-2 shadow-sm transition-colors ${
              comparing ? 'bg-primary-600 text-white' : 'bg-white/90 text-gray-600 hover:bg-white'
            }`}
          >
            <FiRepeat size={16} />
          </button>
        </div>

        {/* Quick View */}
        <button
          onClick={() => setQuickViewOpen(true)}
          className="absolute inset-x-3 bottom-3 flex translate-y-2 items-center justify-center gap-1.5 rounded-lg bg-white/95 py-2 text-xs font-semibold text-primary-800 opacity-0 shadow-sm transition-all duration-200 hover:bg-white group-hover:translate-y-0 group-hover:opacity-100"
        >
          <FiEye size={14} /> Quick View
        </button>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
          {product.category}
        </p>

        {product.vendor_id && (
          <Link
            to={`/store/${product.vendor_slug}`}
            onClick={(e) => e.stopPropagation()}
            className="mb-1.5 block text-xs font-medium text-primary-600 hover:underline"
          >
            Sold by {product.vendor_name}
          </Link>
        )}

        <h3 className="mb-2 line-clamp-2 font-semibold text-gray-900 hover:text-primary-600">
          {product.name}
        </h3>

        <div className="mb-3 flex items-center gap-1 text-sm">
          <FiStar className="text-amber-400" fill="#fbbf24" size={14} />
          <span className="font-medium text-gray-700">{product.rating}</span>
        </div>

        <div className="mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-gray-900">GHS {discountedPrice.toFixed(2)}</span>
            {product.discount_percent > 0 && (
              <span className="text-sm text-gray-400 line-through">GHS {product.price.toFixed(2)}</span>
            )}
          </div>
          {product.discount_percent > 0 && (
            <p className="text-sm font-medium text-green-600">
              Save GHS {(product.price - discountedPrice).toFixed(2)} ({savings}%)
            </p>
          )}
        </div>

        <div className="mb-3">
          {product.stock_quantity > 10 ? (
            <span className="text-sm font-medium text-green-600">In Stock</span>
          ) : product.stock_quantity > 0 ? (
            <span className="text-sm font-medium text-amber-600">Only {product.stock_quantity} left</span>
          ) : (
            <span className="text-sm font-medium text-red-500">Out of Stock</span>
          )}
        </div>

        <div className="mb-3 flex items-center gap-2">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={product.stock_quantity === 0}
            className="rounded-lg border border-gray-200 px-2.5 py-1 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            &minus;
          </button>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            min="1"
            max={product.stock_quantity}
            className="w-12 rounded-lg border border-gray-200 py-1 text-center"
            disabled={product.stock_quantity === 0}
          />
          <button
            onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
            disabled={product.stock_quantity === 0}
            className="rounded-lg border border-gray-200 px-2.5 py-1 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            +
          </button>
        </div>

        <div className="space-y-2">
          <Button
            onClick={handleAddToCart}
            disabled={product.stock_quantity === 0}
            loading={loading}
            fullWidth
          >
            <FiShoppingCart size={16} />
            Add to Cart
          </Button>

          <Button
            variant="outline"
            onClick={handleWhatsAppOrder}
            disabled={loading}
            fullWidth
            className="border-green-200 text-green-700 hover:bg-green-50"
            title="Send product details to WhatsApp for direct quote"
          >
            <FiMessageCircle size={16} />
            WhatsApp Order
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
