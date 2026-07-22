/**
 * Wishlist Context
 * Global state management for a logged-in customer's saved products
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import { wishlistAPI } from '../api';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchWishlist();
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleLogin = () => fetchWishlist();
    const handleLogout = () => setItems([]);
    window.addEventListener('auth-login', handleLogin);
    window.addEventListener('auth-logout', handleLogout);
    return () => {
      window.removeEventListener('auth-login', handleLogin);
      window.removeEventListener('auth-logout', handleLogout);
    };
  }, []);

  const fetchWishlist = async () => {
    try {
      setError(null);
      const response = await wishlistAPI.getAll();
      setItems(response.data.data);
    } catch (err) {
      console.error('Failed to fetch wishlist:', err);
      setError(err.response?.data?.error || 'Failed to fetch wishlist');
    } finally {
      setLoading(false);
    }
  };

  const isWishlisted = (productId) => items.some((item) => item.product?.id === productId);

  const toggleItem = async (productId) => {
    try {
      setError(null);
      if (isWishlisted(productId)) {
        await wishlistAPI.remove(productId);
        setItems((prev) => prev.filter((item) => item.product?.id !== productId));
      } else {
        const response = await wishlistAPI.add(productId);
        setItems((prev) => [response.data.data, ...prev]);
      }
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to update wishlist';
      setError(message);
      throw new Error(message);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        items,
        loading,
        error,
        fetchWishlist,
        toggleItem,
        isWishlisted,
        itemCount: items.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
};
