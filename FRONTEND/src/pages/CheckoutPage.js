/**
 * Checkout Page
 * Handles shipping info collection and payment method selection with location access control
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ordersAPI, paymentAPI } from '../api';
import { checkUserLocationAccess } from '../utils/locationUtils';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, clearCart, totalPrice } = useCart();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('paystack');
  const [locationAccess, setLocationAccess] = useState(null);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const loadPaystackScript = () => {
    return new Promise((resolve, reject) => {
      if (window.PaystackPop) {
        return resolve();
      }

      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Paystack SDK'));
      document.body.appendChild(script);
    });
  };

  const paystackPublicKey = process.env.REACT_APP_PAYSTACK_PUBLIC_KEY;

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const access = await checkUserLocationAccess(token);
        setLocationAccess(access);
      } catch (error) {
        console.error('Error checking location access:', error);
        setLocationAccess({ can_access: false, reason: 'Unable to verify location access' });
      }
      setCheckingAccess(false);
    };

    checkAccess();
  }, []);

  const [formData, setFormData] = useState({
    shipping_address: user?.address || '',
    shipping_city: user?.city || '',
    shipping_phone: user?.phone || '',
    shipping_cost: 5.0,
    notes: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const createOrder = async () => {
    try {
      setLoading(true);

      // Validate form
      if (!formData.shipping_address || !formData.shipping_city || !formData.shipping_phone) {
        alert('❌ Please fill in all required fields');
        setLoading(false);
        return;
      }

      if (paymentMethod === 'paystack' && !paystackPublicKey) {
        alert('❌ Paystack public key is not configured. Contact support.');
        setLoading(false);
        return;
      }

      if (!user?.email) {
        alert('❌ User email is required to complete payment. Please log in again.');
        setLoading(false);
        return;
      }

      const orderResponse = await ordersAPI.create({
        ...formData,
        payment_method: paymentMethod,
      });
      const order = orderResponse.data.data;

      if (paymentMethod === 'paystack') {
        await loadPaystackScript();

        const paystackHandler = window.PaystackPop.setup({
          key: paystackPublicKey,
          email: user.email,
          amount: Math.round(order.total_amount * 100),
          ref: `${order.order_number}-${Date.now()}`,
          metadata: {
            order_id: order.id,
            order_number: order.order_number,
            user_id: user.id,
          },
          onClose: () => {
            setLoading(false);
            alert('⚠️ Payment window closed. Your order has been saved as pending. Please try again.');
          },
          callback: async (response) => {
            try {
              const verifyResponse = await paymentAPI.verifyPayment({
                reference: response.reference,
              });

              await clearCart();
              alert('✅ Payment completed successfully! Order #' + order.order_number);
              navigate(`/orders/${order.id}`);
            } catch (verifyError) {
              console.error('Paystack verify failed', verifyError);
              alert(
                `❌ Payment was authorized but verification failed. Please contact support or try again.`
              );
            } finally {
              setLoading(false);
            }
          },
        });

        paystackHandler.openIframe();
      } else if (paymentMethod === 'whatsapp') {
        const whatsappResponse = await paymentAPI.whatsappOrder({
          product_id: cart.items[0].product.id,
          quantity: cart.items[0].quantity,
          customer_name: user.full_name,
          customer_phone: formData.shipping_phone,
        });

        window.open(whatsappResponse.data.data.whatsapp_url, '_blank');

        alert(
          '✅ Order created! Please follow up on WhatsApp for payment details.\n\nOrder #: ' +
            order.order_number
        );

        await clearCart();
        navigate(`/orders/${order.id}`);
      }
    } catch (error) {
      alert(`❌ ${error.response?.data?.error || error.message}`);
      setLoading(false);
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
          <button
            onClick={() => navigate('/products')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg"
          >
            Continue Shopping
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
          <h1 className="text-2xl font-bold mb-4 text-red-600">Cannot Checkout</h1>
          <p className="text-gray-600 mb-6">{locationAccess.reason}</p>
          <p className="text-sm text-gray-500 mb-6">
            Service is not available in your current location. Please contact support for assistance.
          </p>
          <button
            onClick={() => navigate('/cart')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 mr-4"
          >
            Back to Cart
          </button>
          <button
            onClick={() => navigate('/')}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const totalWithShipping = totalPrice + (formData.shipping_cost || 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8">📦 Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">📍 Shipping Information</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Shipping Address *
                  </label>
                  <input
                    type="text"
                    name="shipping_address"
                    value={formData.shipping_address}
                    onChange={handleInputChange}
                    placeholder="Enter your street address"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">City *</label>
                    <input
                      type="text"
                      name="shipping_city"
                      value={formData.shipping_city}
                      onChange={handleInputChange}
                      placeholder="e.g., Accra"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="shipping_phone"
                      value={formData.shipping_phone}
                      onChange={handleInputChange}
                      placeholder="e.g., +233123456789"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Shipping Cost (GHS)
                  </label>
                  <input
                    type="number"
                    name="shipping_cost"
                    value={formData.shipping_cost}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Default shipping cost: GHS 5.00
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Order Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Any special requests or notes?"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    rows="3"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">💳 Payment Method</h2>

              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Email for Payment</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Paystack requires a valid email to complete the transaction.
                </p>
              </div>

              <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex justify-between text-sm text-gray-700 mb-2">
                  <span>Payment Amount</span>
                  <span>GHS {totalWithShipping.toFixed(2)}</span>
                </div>
                <div className="text-xs text-gray-500">
                  This amount is secured and verified by Paystack before finalizing the order.
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50" 
                       style={{ borderColor: paymentMethod === 'paystack' ? '#2563eb' : '#d1d5db' }}>
                  <input
                    type="radio"
                    checked={paymentMethod === 'paystack'}
                    onChange={() => setPaymentMethod('paystack')}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-semibold">💳 Paystack (Credit/Debit Card)</div>
                    <div className="text-sm text-gray-600">
                      Secure payment with Visa, Mastercard, or Mobile Money
                    </div>
                  </div>
                </label>

                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                       style={{ borderColor: paymentMethod === 'whatsapp' ? '#2563eb' : '#d1d5db' }}>
                  <input
                    type="radio"
                    checked={paymentMethod === 'whatsapp'}
                    onChange={() => setPaymentMethod('whatsapp')}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-semibold">💬 WhatsApp Quote</div>
                    <div className="text-sm text-gray-600">
                      Receive quote and pay via WhatsApp payment methods
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-20">
              <h2 className="text-2xl font-bold mb-6">Order Summary</h2>

              {/* Products */}
              <div className="mb-4 pb-4 border-b max-h-40 overflow-y-auto">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex justify-between mb-3 text-sm">
                    <span className="text-gray-600">
                      {item.product.name} x{item.quantity}
                    </span>
                    <span className="font-semibold">
                      GHS {item.subtotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Subtotal */}
              <div className="flex justify-between mb-3 text-gray-600">
                <span>Subtotal</span>
                <span>GHS {totalPrice.toFixed(2)}</span>
              </div>

              {/* Shipping */}
              <div className="flex justify-between mb-3 pb-3 border-b text-gray-600">
                <span>Shipping</span>
                <span>GHS {(formData.shipping_cost || 0).toFixed(2)}</span>
              </div>

              {/* Total */}
              <div className="flex justify-between mb-6 text-2xl font-bold text-blue-600">
                <span>Total</span>
                <span>GHS {totalWithShipping.toFixed(2)}</span>
              </div>

              {/* Checkout Button */}
              <button
                onClick={createOrder}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '⏳ Processing...' : '✅ Place Order'}
              </button>

              {/* Security Info */}
              <div className="mt-4 p-3 bg-green-50 rounded text-sm text-gray-700">
                🔒 <strong>Secure checkout</strong> - Your information is encrypted and safe
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
