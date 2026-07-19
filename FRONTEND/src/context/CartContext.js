/**
 * Cart Context
 * Global state management for shopping cart
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import { cartAPI } from '../api';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch cart on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchCart();
    } else {
      setLoading(false);
    }
  }, []);

  // Keep cart state in sync with auth state: fetch on login (so the badge
  // reflects the newly-signed-in user's real cart immediately), and clear
  // on logout (manual, or automatic via a 401 response) — otherwise the
  // last-fetched cart lingers after the user is no longer authenticated.
  useEffect(() => {
    const handleLogin = () => fetchCart();
    const handleLogout = () => setCart(null);
    window.addEventListener('auth-login', handleLogin);
    window.addEventListener('auth-logout', handleLogout);
    return () => {
      window.removeEventListener('auth-login', handleLogin);
      window.removeEventListener('auth-logout', handleLogout);
    };
  }, []);

  const fetchCart = async () => {
    try {
      setError(null);
      const response = await cartAPI.getCart();
      setCart(response.data.data);
    } catch (err) {
      console.error('Failed to fetch cart:', err);
      setError(err.response?.data?.error || 'Failed to fetch cart');
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (productId, quantity = 1) => {
    try {
      setError(null);
      const response = await cartAPI.addItem({ product_id: productId, quantity });
      setCart(response.data.data.cart);
      return response.data.data.item;
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to add item to cart';
      setError(message);
      throw new Error(message);
    }
  };

  const updateItem = async (itemId, quantity) => {
    try {
      setError(null);
      const response = await cartAPI.updateItem(itemId, { quantity });
      setCart(response.data.data);
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to update cart item';
      setError(message);
      throw new Error(message);
    }
  };

  const removeItem = async (itemId) => {
    try {
      setError(null);
      const response = await cartAPI.removeItem(itemId);
      setCart(response.data.data);
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to remove item from cart';
      setError(message);
      throw new Error(message);
    }
  };

  const clearCart = async () => {
    try {
      setError(null);
      const response = await cartAPI.clearCart();
      setCart(response.data.data);
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to clear cart';
      setError(message);
      throw new Error(message);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        fetchCart,
        addItem,
        updateItem,
        removeItem,
        clearCart,
        itemCount: cart?.total_items || 0,
        totalPrice: cart?.total_price || 0,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
