/**
 * Cart Page
 * Displays shopping cart items and checkout with location access control
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTrash2, FiArrowRight } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { checkUserLocationAccess } from '../utils/locationUtils';

const CartPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { cart, loading, removeItem, updateItem, clearCart, totalPrice, itemCount } = useCart();
  const [updatingItems, setUpdatingItems] = useState({});
  const [locationAccess, setLocationAccess] = useState(null);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (isAuthenticated) {
        try {
          const token = localStorage.getItem('access_token');
          const access = await checkUserLocationAccess(token);
          setLocationAccess(access);
        } catch (error) {
          console.error('Error checking location access:', error);
          setLocationAccess({ can_access: false, reason: 'Unable to verify location access' });
        }
      }
      setCheckingAccess(false);
    };

    checkAccess();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">🔐 Please Login</h1>
          <p className="text-gray-600 mb-6">You need to be logged in to view your cart</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (checkingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 text-lg">Checking location access... ⏳</p>
      </div>
    );
  }

  if (locationAccess && !locationAccess.can_access) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold mb-4 text-red-600">Service Not Available</h1>
          <p className="text-gray-600 mb-6">{locationAccess.reason}</p>
          <p className="text-sm text-gray-500 mb-6">
            We're not currently offering services in your location. Please contact support if you believe this is an error.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 text-lg">Loading cart... ⏳</p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🛒</div>
            <h1 className="text-3xl font-bold mb-2">Your Cart is Empty</h1>
            <p className="text-gray-600 mb-6">Start shopping to add items to your cart!</p>
            <button
              onClick={() => navigate('/products')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
            >
              Continue Shopping <FiArrowRight />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    try {
      setUpdatingItems({ ...updatingItems, [itemId]: true });
      await updateItem(itemId, newQuantity);
    } catch (error) {
      alert(`❌ ${error.message}`);
    } finally {
      setUpdatingItems({ ...updatingItems, [itemId]: false });
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (window.confirm('Are you sure you want to remove this item?')) {
      try {
        await removeItem(itemId);
      } catch (error) {
        alert(`❌ ${error.message}`);
      }
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Clear entire cart? This action cannot be undone.')) {
      try {
        await clearCart();
      } catch (error) {
        alert(`❌ ${error.message}`);
      }
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8">🛒 Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {/* Cart Header */}
              <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                <span className="font-semibold">
                  {itemCount} Item{itemCount !== 1 ? 's' : ''} in Cart
                </span>
                <button
                  onClick={handleClearCart}
                  className="text-red-600 hover:text-red-700 text-sm font-semibold"
                >
                  Clear Cart
                </button>
              </div>

              {/* Cart Items List */}
              <div className="divide-y">
                {cart.items.map((item) => (
                  <div key={item.id} className="p-6 flex gap-4">
                    {/* Product Image */}
                    <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.product.image_url || '🖼️'}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{item.product.name}</h3>
                      <p className="text-gray-600 text-sm mb-2">
                        SKU: {item.product.sku}
                      </p>

                      {/* Price */}
                      <div className="mb-3">
                        <span className="font-bold text-blue-600">
                          GHS {item.price_at_purchase.toFixed(2)}
                        </span>
                        {item.product.discount_percent > 0 && (
                          <span className="ml-2 text-sm text-green-600">
                            -{item.product.discount_percent}% off
                          </span>
                        )}
                      </div>

                      {/* Quantity Selector */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            handleUpdateQuantity(item.id, Math.max(1, item.quantity - 1))
                          }
                          disabled={updatingItems[item.id]}
                          className="border px-3 py-1 rounded hover:bg-gray-100 disabled:opacity-50"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateQuantity(item.id, Math.max(1, parseInt(e.target.value) || 1))
                          }
                          min="1"
                          className="w-16 text-center border px-2 py-1 rounded"
                          disabled={updatingItems[item.id]}
                        />
                        <button
                          onClick={() =>
                            handleUpdateQuantity(item.id, item.quantity + 1)
                          }
                          disabled={updatingItems[item.id]}
                          className="border px-3 py-1 rounded hover:bg-gray-100 disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Subtotal and Delete */}
                    <div className="text-right">
                      <div className="font-bold text-lg text-blue-600 mb-4">
                        GHS {item.subtotal.toFixed(2)}
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-600 hover:text-red-700 flex items-center gap-2"
                      >
                        <FiTrash2 />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-20">
              <h2 className="text-2xl font-bold mb-6">Order Summary</h2>

              {/* Subtotal */}
              <div className="flex justify-between mb-4 pb-4 border-b">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">GHS {totalPrice.toFixed(2)}</span>
              </div>

              {/* Shipping */}
              <div className="flex justify-between mb-4 pb-4 border-b">
                <span className="text-gray-600">Shipping</span>
                <span className="font-semibold">To be calculated</span>
              </div>

              {/* Discount Summary */}
              {cart.items.some((item) => item.product.discount_percent > 0) && (
                <div className="flex justify-between mb-4 pb-4 border-b text-green-600">
                  <span>Total Discount</span>
                  <span className="font-semibold">
                    GHS{' '}
                    {cart.items
                      .reduce((sum, item) => sum + ((item.product.price - item.price_at_purchase) * item.quantity), 0)
                      .toFixed(2)}
                  </span>
                </div>
              )}

              {/* Total */}
              <div className="flex justify-between mb-6 text-xl font-bold">
                <span>Total</span>
                <span className="text-blue-600">GHS {totalPrice.toFixed(2)}</span>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-bold flex items-center justify-center gap-2"
              >
                Proceed to Checkout <FiArrowRight />
              </button>

              {/* Continue Shopping */}
              <button
                onClick={() => navigate('/products')}
                className="w-full mt-3 border border-blue-600 text-blue-600 py-3 rounded-lg hover:bg-blue-50 transition font-bold"
              >
                Continue Shopping
              </button>

              {/* Info Box */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  ✅ <strong>Secure checkout</strong> - Your payment information is encrypted
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
