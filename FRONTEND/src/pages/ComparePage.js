/**
 * Compare Page
 * Side-by-side comparison table for products the shopper picked via the
 * compare icon on ProductCard (localStorage-backed, see CompareContext).
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiRepeat, FiStar } from 'react-icons/fi';
import { useCompare } from '../context/CompareContext';
import { useCart } from '../context/CartContext';
import { productsAPI } from '../api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import PlaceholderImage from '../components/ui/PlaceholderImage';
import { toast } from '../components/ui/Toast';

const ROWS = [
  { key: 'price', label: 'Price', render: (p) => `GHS ${(p.discounted_price ?? p.price).toFixed(2)}` },
  { key: 'discount', label: 'Discount', render: (p) => (p.discount_percent > 0 ? `${p.discount_percent}% off` : '—') },
  {
    key: 'rating',
    label: 'Rating',
    render: (p) => (
      <span className="inline-flex items-center gap-1">
        <FiStar className="text-amber-400" fill="#fbbf24" size={14} />
        {p.rating} ({p.review_count || 0})
      </span>
    ),
  },
  { key: 'stock', label: 'Stock', render: (p) => (p.stock_quantity > 0 ? `${p.stock_quantity} available` : 'Out of stock') },
  { key: 'category', label: 'Category', render: (p) => p.category },
];

const ComparePage = () => {
  const navigate = useNavigate();
  const { productIds, removeFromCompare, clearCompare } = useCompare();
  const { addItem } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productIds.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    productsAPI
      .getAll({ ids: productIds.join(','), limit: productIds.length })
      .then((response) => {
        const byId = new Map(response.data.data.products.map((p) => [p.id, p]));
        setProducts(productIds.map((id) => byId.get(id)).filter(Boolean));
      })
      .finally(() => setLoading(false));
  }, [productIds]);

  const handleAddToCart = async (productId) => {
    try {
      await addItem(productId, 1);
      toast.success('Added to cart');
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Compare Products</h1>
          {products.length > 0 && (
            <button onClick={clearCompare} className="text-sm font-semibold text-gray-500 hover:text-red-600">
              Clear All
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-500">Loading&hellip;</div>
        ) : products.length === 0 ? (
          <Card className="py-16 text-center">
            <FiRepeat className="mx-auto mb-4 text-gray-300" size={48} />
            <p className="mb-4 text-lg text-gray-600">
              Add up to 4 products to compare using the compare icon on any product card
            </p>
            <Button onClick={() => navigate('/products')}>Browse Products</Button>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="w-32"></th>
                  {products.map((product) => (
                    <th key={product.id} className="p-3 text-left align-top">
                      <Card padded={false} className="relative overflow-hidden">
                        <button
                          onClick={() => removeFromCompare(product.id)}
                          className="absolute right-2 top-2 z-10 rounded-full bg-white/90 p-1.5 shadow-sm hover:bg-white"
                        >
                          <FiX size={14} />
                        </button>
                        <div className="h-32 bg-gray-100">
                          <PlaceholderImage src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="p-3">
                          <p className="mb-2 line-clamp-2 text-sm font-semibold text-gray-900">{product.name}</p>
                          <Button size="sm" fullWidth onClick={() => handleAddToCart(product.id)} disabled={product.stock_quantity === 0}>
                            Add to Cart
                          </Button>
                        </div>
                      </Card>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.key} className="border-t border-gray-100">
                    <td className="p-3 text-sm font-semibold text-gray-500">{row.label}</td>
                    {products.map((product) => (
                      <td key={product.id} className="p-3 text-sm text-gray-800">
                        {row.render(product)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparePage;
