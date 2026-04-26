/**
 * Product Card Component
 * Displays individual product with image, price, discount, rating, and action buttons
 */

import React, { useState } from 'react';
import { FiShoppingCart, FiHeart } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { paymentAPI } from '../api';

const ProductCard = ({ product, isBestDeal = false }) => {
  const { addItem } = useCart();
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = async () => {
    try {
      setLoading(true);
      await addItem(product.id, quantity);
      alert('✅ Product added to cart!');
      setQuantity(1);
    } catch (error) {
      alert(`❌ ${error.message}`);
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

      // Open WhatsApp link
      window.open(response.data.data.whatsapp_url, '_blank');
      setQuantity(1);
    } catch (error) {
      alert(`❌ Failed to open WhatsApp: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const discountedPrice = product.discounted_price || product.price;
  const savings = ((product.price - discountedPrice) / product.price * 100).toFixed(0);

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden">
      {/* Product Image */}
      <div className="relative bg-gray-200 h-48 overflow-hidden">
        <img
          src={product.image_url || '🖼️'}
          alt={product.name}
          className="w-full h-full object-cover hover:scale-110 transition duration-300"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 space-y-2">
          {isBestDeal && (
            <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
              🏆 Best Deal
            </div>
          )}
          {product.is_flash_sale && (
            <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              ⚡ Flash Sale
            </div>
          )}
          {product.is_trending && (
            <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              🔥 Trending
            </div>
          )}
          {product.discount_percent > 0 && (
            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              -{product.discount_percent}%
            </div>
          )}
        </div>

        {/* Like Button */}
        <button
          onClick={() => setLiked(!liked)}
          className="absolute top-3 right-3 bg-white rounded-full p-2 hover:bg-red-50 transition"
        >
          <FiHeart size={20} fill={liked ? 'red' : 'none'} color={liked ? 'red' : 'currentColor'} />
        </button>
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Category */}
        <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
          {product.category}
        </p>

        {/* Product Name */}
        <h3 className="font-bold text-lg mb-2 line-clamp-2 hover:text-blue-600">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center mb-3">
          <span className="text-yellow-400">⭐ {product.rating}</span>
          <span className="text-gray-500 text-sm ml-2">({product.rating} stars)</span>
        </div>

        {/* Price */}
        <div className="mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-600">GHS {discountedPrice.toFixed(2)}</span>
            {product.discount_percent > 0 && (
              <span className="text-lg text-gray-400 line-through">GHS {product.price.toFixed(2)}</span>
            )}
          </div>
          {product.discount_percent > 0 && (
            <p className="text-sm text-green-600 font-semibold">
              Save GHS {(product.price - discountedPrice).toFixed(2)} ({savings}%)
            </p>
          )}
        </div>

        {/* Stock Status */}
        <div className="mb-3">
          {product.stock_quantity > 10 ? (
            <span className="text-green-600 text-sm font-semibold">✅ In Stock</span>
          ) : product.stock_quantity > 0 ? (
            <span className="text-orange-600 text-sm font-semibold">⚠️ Only {product.stock_quantity} left</span>
          ) : (
            <span className="text-red-600 text-sm font-semibold">❌ Out of Stock</span>
          )}
        </div>

        {/* Quantity Selector */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={product.stock_quantity === 0}
            className="border px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-50"
          >
            −
          </button>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            min="1"
            max={product.stock_quantity}
            className="w-12 text-center border px-2 py-1 rounded"
            disabled={product.stock_quantity === 0}
          />
          <button
            onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
            disabled={product.stock_quantity === 0}
            className="border px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-50"
          >
            +
          </button>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock_quantity === 0 || loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
          >
            <FiShoppingCart />
            {loading ? 'Adding...' : 'Add to Cart'}
          </button>

          {/* WhatsApp Order Button */}
          <button
            onClick={handleWhatsAppOrder}
            disabled={loading}
            className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            title="Send product details to WhatsApp for direct quote"
          >
            💬 WhatsApp Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
