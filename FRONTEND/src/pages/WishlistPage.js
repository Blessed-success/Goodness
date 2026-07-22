/**
 * Wishlist Page
 * Shows every product the logged-in customer has saved
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHeart } from 'react-icons/fi';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const WishlistPage = () => {
  const navigate = useNavigate();
  const { items, loading } = useWishlist();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">My Wishlist</h1>

        {loading ? (
          <div className="py-16 text-center text-gray-500">Loading wishlist&hellip;</div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <ProductCard key={item.id} product={item.product} />
            ))}
          </div>
        ) : (
          <Card className="py-16 text-center">
            <FiHeart className="mx-auto mb-4 text-gray-300" size={48} />
            <p className="mb-4 text-lg text-gray-600">Your wishlist is empty</p>
            <Button onClick={() => navigate('/products')}>Browse Products</Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
