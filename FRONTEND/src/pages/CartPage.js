/**
 * Cart Page
 * Displays shopping cart items and checkout with location access control
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTrash2, FiArrowRight, FiShoppingCart, FiLock, FiSlash } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { checkUserLocationAccess } from '../utils/locationUtils';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import PlaceholderImage from '../components/ui/PlaceholderImage';
import { toast } from '../components/ui/Toast';

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
          setLocationAccess({ can_access: false, reason: 'Unable to verify location access' });
        }
      }
      setCheckingAccess(false);
    };

    checkAccess();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <FiLock className="mx-auto mb-4 text-gray-300" size={40} />
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Please Login</h1>
          <p className="mb-6 text-gray-500">You need to be logged in to view your cart</p>
          <Button onClick={() => navigate('/login')}>Go to Login</Button>
        </div>
      </div>
    );
  }

  if (checkingAccess) {
    return <div className="flex min-h-screen items-center justify-center text-gray-500">Checking availability&hellip;</div>;
  }

  if (locationAccess && !locationAccess.can_access) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="mx-auto max-w-md text-center">
          <FiSlash className="mx-auto mb-4 text-gray-300" size={40} />
          <h1 className="mb-3 text-xl font-bold text-red-600">Service Not Available</h1>
          <p className="mb-4 text-gray-500">{locationAccess.reason}</p>
          <p className="mb-6 text-sm text-gray-400">
            We're not currently offering services in your location. Please contact support if you believe this is an error.
          </p>
          <Button onClick={() => navigate('/')}>Return to Home</Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-gray-500">Loading cart&hellip;</div>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <FiShoppingCart className="mx-auto mb-4 text-gray-300" size={48} />
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Your Cart is Empty</h1>
          <p className="mb-6 text-gray-500">Start shopping to add items to your cart!</p>
          <Button onClick={() => navigate('/products')}>
            Continue Shopping <FiArrowRight />
          </Button>
        </div>
      </div>
    );
  }

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    try {
      setUpdatingItems({ ...updatingItems, [itemId]: true });
      await updateItem(itemId, newQuantity);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUpdatingItems({ ...updatingItems, [itemId]: false });
    }
  };

  const handleRemoveItem = async (itemId) => {
    const confirmed = await toast.confirm('This item will be removed from your cart.', {
      title: 'Remove item?',
      confirmText: 'Remove',
      danger: true,
    });
    if (!confirmed) return;

    try {
      await removeItem(itemId);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleClearCart = async () => {
    const confirmed = await toast.confirm('This action cannot be undone.', {
      title: 'Clear entire cart?',
      confirmText: 'Clear cart',
      danger: true,
    });
    if (!confirmed) return;

    try {
      await clearCart();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Shopping Cart</h1>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <Card padded={false}>
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <span className="font-semibold text-gray-900">
                  {itemCount} Item{itemCount !== 1 ? 's' : ''} in Cart
                </span>
                <button onClick={handleClearCart} className="text-sm font-semibold text-red-600 hover:text-red-700">
                  Clear Cart
                </button>
              </div>

              <div className="divide-y divide-gray-100">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-6">
                    <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      <PlaceholderImage
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="flex-1">
                      <h3 className="mb-1 font-semibold text-gray-900">{item.product.name}</h3>
                      <p className="mb-2 text-sm text-gray-500">SKU: {item.product.sku}</p>

                      <div className="mb-3">
                        <span className="font-bold text-gray-900">GHS {item.price_at_purchase.toFixed(2)}</span>
                        {item.product.discount_percent > 0 && (
                          <span className="ml-2 text-sm text-green-600">-{item.product.discount_percent}% off</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          disabled={updatingItems[item.id]}
                          className="rounded-lg border border-gray-200 px-3 py-1 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                        >
                          &minus;
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleUpdateQuantity(item.id, Math.max(1, parseInt(e.target.value) || 1))}
                          min="1"
                          className="w-16 rounded-lg border border-gray-200 py-1 text-center"
                          disabled={updatingItems[item.id]}
                        />
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          disabled={updatingItems[item.id]}
                          className="rounded-lg border border-gray-200 px-3 py-1 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="mb-4 text-lg font-bold text-gray-900">GHS {item.subtotal.toFixed(2)}</div>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700"
                      >
                        <FiTrash2 size={14} /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <h2 className="mb-6 text-xl font-bold text-gray-900">Order Summary</h2>

              <div className="mb-4 flex justify-between border-b border-gray-100 pb-4 text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-semibold text-gray-900">GHS {totalPrice.toFixed(2)}</span>
              </div>

              <div className="mb-4 flex justify-between border-b border-gray-100 pb-4 text-sm">
                <span className="text-gray-500">Shipping</span>
                <span className="font-semibold text-gray-900">To be calculated</span>
              </div>

              {cart.items.some((item) => item.product.discount_percent > 0) && (
                <div className="mb-4 flex justify-between border-b border-gray-100 pb-4 text-sm text-green-600">
                  <span>Total Discount</span>
                  <span className="font-semibold">
                    GHS{' '}
                    {cart.items
                      .reduce((sum, item) => sum + (item.product.price - item.price_at_purchase) * item.quantity, 0)
                      .toFixed(2)}
                  </span>
                </div>
              )}

              <div className="mb-6 flex justify-between text-lg font-bold text-gray-900">
                <span>Total</span>
                <span>GHS {totalPrice.toFixed(2)}</span>
              </div>

              <Button fullWidth size="lg" onClick={() => navigate('/checkout')}>
                Proceed to Checkout <FiArrowRight />
              </Button>

              <Button variant="outline" fullWidth size="lg" className="mt-3" onClick={() => navigate('/products')}>
                Continue Shopping
              </Button>

              <div className="mt-6 rounded-lg bg-primary-50 p-4 text-sm text-gray-600">
                <strong className="text-gray-900">Secure checkout</strong> — your payment information is encrypted
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
