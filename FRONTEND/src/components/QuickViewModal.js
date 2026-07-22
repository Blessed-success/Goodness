/**
 * QuickViewModal
 * Lets a shopper preview a product's full details from its card without
 * leaving the current page — image, description, rating, price, stock,
 * and add-to-cart, all sourced from the product object already on hand.
 */

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { FiX, FiShoppingCart, FiStar } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import Badge from './ui/Badge';
import Button from './ui/Button';
import PlaceholderImage from './ui/PlaceholderImage';
import { toast } from './ui/Toast';
import { addRecentlyViewed } from '../utils/recentlyViewed';
import ProductReviews from './ProductReviews';
import { productsAPI } from '../api';

const QuickViewModal = ({ product, onClose }) => {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  useEffect(() => {
    addRecentlyViewed(product);
  }, [product]);

  useEffect(() => {
    if (!product.category) return;
    productsAPI
      .getAll({ category: product.category, limit: 5 })
      .then((response) => setRelated(response.data.data.products.filter((p) => p.id !== product.id).slice(0, 4)))
      .catch(() => setRelated([]));
  }, [product]);

  const handleAddToCart = async () => {
    try {
      setLoading(true);
      await addItem(product.id, quantity);
      toast.success('Added to cart');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const discountedPrice = product.discounted_price || product.price;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-primary-900/70 p-4"
      onClick={onClose}
    >
      <div
        className="relative grid max-h-[90vh] w-full max-w-3xl grid-cols-1 overflow-y-auto rounded-2xl bg-white shadow-2xl sm:grid-cols-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close quick view"
          autoFocus
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-sm hover:bg-white"
        >
          <FiX size={18} />
        </button>

        <div className="h-56 bg-gray-100 sm:h-full">
          <PlaceholderImage
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="flex flex-col p-6">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
            {product.category}
          </p>
          {product.vendor_id && (
            <Link
              to={`/store/${product.vendor_slug}`}
              onClick={onClose}
              className="mb-1 block text-xs font-medium text-primary-600 hover:underline"
            >
              Sold by {product.vendor_name}
            </Link>
          )}
          <h2 className="mb-2 text-xl font-bold text-gray-900">{product.name}</h2>

          <div className="mb-3 flex items-center gap-1 text-sm">
            <FiStar className="text-amber-400" fill="#fbbf24" size={14} />
            <span className="font-medium text-gray-700">{product.rating}</span>
          </div>

          {product.description && (
            <p className="mb-4 line-clamp-4 text-sm text-gray-600">{product.description}</p>
          )}

          <div className="mb-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">GHS {discountedPrice.toFixed(2)}</span>
            {product.discount_percent > 0 && (
              <span className="text-sm text-gray-400 line-through">GHS {product.price.toFixed(2)}</span>
            )}
          </div>

          <div className="mb-4 flex flex-wrap gap-1.5">
            {product.is_flash_sale && <Badge variant="danger">Flash Sale</Badge>}
            {product.is_trending && <Badge variant="warning">Trending</Badge>}
            {product.discount_percent > 0 && <Badge variant="success">-{product.discount_percent}%</Badge>}
            {product.stock_quantity === 0 ? (
              <Badge variant="danger">Out of Stock</Badge>
            ) : product.stock_quantity <= 10 ? (
              <Badge variant="warning">Only {product.stock_quantity} left</Badge>
            ) : (
              <Badge variant="success">In Stock</Badge>
            )}
          </div>

          <div className="mt-auto flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={product.stock_quantity === 0}
                className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                &minus;
              </button>
              <span className="w-8 text-center font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                disabled={product.stock_quantity === 0}
                className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                +
              </button>
            </div>
            <Button
              onClick={handleAddToCart}
              disabled={product.stock_quantity === 0}
              loading={loading}
              fullWidth
            >
              <FiShoppingCart size={16} />
              Add to Cart
            </Button>
          </div>

          {related.length > 0 && (
            <div className="mt-6 border-t border-gray-100 pt-6">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">You May Also Like</h3>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {related.map((item) => (
                  <Link
                    key={item.id}
                    to={`/products?category=${encodeURIComponent(product.category)}`}
                    onClick={onClose}
                    className="w-24 flex-shrink-0"
                  >
                    <div className="mb-1 h-20 w-24 overflow-hidden rounded-lg bg-gray-100">
                      <PlaceholderImage src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                    </div>
                    <p className="truncate text-xs font-medium text-gray-700">{item.name}</p>
                    <p className="text-xs font-semibold text-gray-900">GHS {(item.discounted_price ?? item.price).toFixed(2)}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <ProductReviews productId={product.id} />
        </div>
      </div>
    </div>,
    document.body
  );
};

export default QuickViewModal;
