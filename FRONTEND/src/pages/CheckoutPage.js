/**
 * Checkout Page
 * Handles shipping info collection and payment method selection with location access control
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSlash, FiCreditCard, FiMessageCircle, FiLock, FiMapPin } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ordersAPI, paymentAPI } from '../api';
import { checkUserLocationAccess, getUserLocationInfo } from '../utils/locationUtils';
import LocationSelector from '../components/LocationSelector';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { toast } from '../components/ui/Toast';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, clearCart, totalPrice } = useCart();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('paystack');
  const [locationAccess, setLocationAccess] = useState(null);
  const [locationInfo, setLocationInfo] = useState(null);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [changingLocation, setChangingLocation] = useState(false);

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

  const refreshLocation = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const [access, info] = await Promise.all([
        checkUserLocationAccess(token),
        getUserLocationInfo(token),
      ]);
      setLocationAccess(access);
      setLocationInfo(info);
    } catch (error) {
      setLocationAccess({ can_access: false, reason: 'Unable to verify location access' });
    }
    setCheckingAccess(false);
  };

  useEffect(() => {
    refreshLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [formData, setFormData] = useState({
    shipping_address: user?.address || '',
    shipping_city: user?.city || '',
    shipping_phone: user?.phone || '',
    notes: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const createOrder = async () => {
    try {
      setLoading(true);

      if (!formData.shipping_address || !formData.shipping_city || !formData.shipping_phone) {
        toast.error('Please fill in all required fields');
        setLoading(false);
        return;
      }

      if (paymentMethod === 'paystack' && !paystackPublicKey) {
        toast.error('Paystack public key is not configured. Contact support.');
        setLoading(false);
        return;
      }

      if (!user?.email) {
        toast.error('User email is required to complete payment. Please log in again.');
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
          currency: 'GHS',
          channels: ['card', 'mobile_money'],
          ref: `${order.order_number}-${Date.now()}`,
          metadata: {
            order_id: order.id,
            order_number: order.order_number,
            user_id: user.id,
          },
          onClose: () => {
            setLoading(false);
            toast.info('Payment window closed. Your order has been saved as pending.');
          },
          // Paystack's inline.js validates this with Object.prototype.toString,
          // which tags `async` functions as "AsyncFunction" (not "Function") and
          // rejects them — so this must stay a plain sync function; the async
          // work runs in an IIFE inside it.
          callback: (response) => {
            (async () => {
              try {
                await paymentAPI.verifyPayment({ reference: response.reference });
                await clearCart();
                toast.success(`Payment completed! Order #${order.order_number}`);
                navigate(`/orders/${order.id}`);
              } catch (verifyError) {
                toast.error('Payment was authorized but verification failed. Please contact support.');
              } finally {
                setLoading(false);
              }
            })();
          },
        });

        paystackHandler.openIframe();
      } else if (paymentMethod === 'whatsapp') {
        const whatsappResponse = await paymentAPI.whatsappOrder({
          order_id: order.id,
          customer_name: user.full_name,
          customer_phone: formData.shipping_phone,
        });

        window.open(whatsappResponse.data.data.whatsapp_url, '_blank');
        toast.success(`Order created! Follow up on WhatsApp for payment. Order #${order.order_number}`);

        await clearCart();
        navigate(`/orders/${order.id}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || error.message);
      setLoading(false);
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">Your cart is empty</h1>
          <Button onClick={() => navigate('/products')}>Continue Shopping</Button>
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
          <h1 className="mb-3 text-xl font-bold text-red-600">Cannot Checkout</h1>
          <p className="mb-6 text-gray-500">{locationAccess.reason}</p>
          <div className="flex justify-center gap-3">
            <Button onClick={() => navigate('/cart')}>Back to Cart</Button>
            <Button variant="outline" onClick={() => navigate('/')}>Return Home</Button>
          </div>
        </Card>
      </div>
    );
  }

  const shippingCost = Number(locationInfo?.delivery_fee) || 0;
  const totalWithShipping = totalPrice + shippingCost;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-5xl px-4">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Checkout</h1>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Checkout Form */}
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <h2 className="mb-4 text-lg font-bold text-gray-900">Shipping Information</h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Shipping Address *</label>
                  <input
                    type="text"
                    name="shipping_address"
                    value={formData.shipping_address}
                    onChange={handleInputChange}
                    placeholder="Enter your street address"
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:border-primary-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">City *</label>
                    <input
                      type="text"
                      name="shipping_city"
                      value={formData.shipping_city}
                      onChange={handleInputChange}
                      placeholder="e.g., Accra"
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:border-primary-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Phone Number *</label>
                    <input
                      type="tel"
                      name="shipping_phone"
                      value={formData.shipping_phone}
                      onChange={handleInputChange}
                      placeholder="e.g., +233123456789"
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:border-primary-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Delivery Fee</label>
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-2">
                    <span className="flex items-center gap-2 font-semibold text-gray-900">
                      <FiMapPin className="text-gray-400" size={16} />
                      GHS {shippingCost.toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {locationInfo?.city_name}, {locationInfo?.region_name}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-sm text-gray-400">Set by your delivery region — not editable.</p>
                    <button
                      type="button"
                      onClick={() => setChangingLocation(!changingLocation)}
                      className="text-sm font-semibold text-primary-600 hover:text-primary-700"
                    >
                      {changingLocation ? 'Cancel' : 'Change delivery location'}
                    </button>
                  </div>
                  {changingLocation && (
                    <div className="mt-3">
                      <LocationSelector
                        initialRegionId={locationInfo?.region_id}
                        initialCityId={locationInfo?.city_id}
                        onLocationSelect={async () => {
                          setChangingLocation(false);
                          await refreshLocation();
                          toast.success('Delivery location updated');
                        }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Order Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Any special requests or notes?"
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:border-primary-500 focus:outline-none"
                    rows="3"
                  />
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="mb-4 text-lg font-bold text-gray-900">Payment Method</h2>

              <div className="mb-4">
                <label className="mb-2 block text-sm font-semibold text-gray-700">Email for Payment</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  readOnly
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2"
                />
                <p className="mt-1 text-sm text-gray-400">Paystack requires a valid email to complete the transaction.</p>
              </div>

              <div className="mb-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
                <div className="mb-2 flex justify-between text-sm text-gray-600">
                  <span>Payment Amount</span>
                  <span>GHS {totalWithShipping.toFixed(2)}</span>
                </div>
                <div className="text-xs text-gray-400">This amount is secured and verified by Paystack before finalizing the order.</div>
              </div>

              <div className="space-y-3">
                <label
                  className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 hover:bg-gray-50"
                  style={{ borderColor: paymentMethod === 'paystack' ? '#2563eb' : '#e5e7eb' }}
                >
                  <input
                    type="radio"
                    checked={paymentMethod === 'paystack'}
                    onChange={() => setPaymentMethod('paystack')}
                  />
                  <FiCreditCard className="text-gray-500" size={20} />
                  <div>
                    <div className="font-semibold text-gray-900">Paystack (Card / Mobile Money)</div>
                    <div className="text-sm text-gray-500">Secure payment with Visa, Mastercard, or Mobile Money</div>
                  </div>
                </label>

                <label
                  className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 hover:bg-gray-50"
                  style={{ borderColor: paymentMethod === 'whatsapp' ? '#2563eb' : '#e5e7eb' }}
                >
                  <input
                    type="radio"
                    checked={paymentMethod === 'whatsapp'}
                    onChange={() => setPaymentMethod('whatsapp')}
                  />
                  <FiMessageCircle className="text-green-600" size={20} />
                  <div>
                    <div className="font-semibold text-gray-900">WhatsApp Quote</div>
                    <div className="text-sm text-gray-500">Receive a quote and pay via WhatsApp payment methods</div>
                  </div>
                </label>
              </div>
            </Card>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <h2 className="mb-6 text-xl font-bold text-gray-900">Order Summary</h2>

              <div className="mb-4 max-h-40 overflow-y-auto border-b border-gray-100 pb-4">
                {cart.items.map((item) => (
                  <div key={item.id} className="mb-3 flex justify-between text-sm">
                    <span className="text-gray-500">
                      {item.product.name} x{item.quantity}
                    </span>
                    <span className="font-semibold text-gray-900">GHS {item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="mb-3 flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>GHS {totalPrice.toFixed(2)}</span>
              </div>

              <div className="mb-3 flex justify-between border-b border-gray-100 pb-3 text-sm text-gray-500">
                <span>Shipping</span>
                <span>GHS {shippingCost.toFixed(2)}</span>
              </div>

              <div className="mb-6 flex justify-between text-xl font-bold text-gray-900">
                <span>Total</span>
                <span>GHS {totalWithShipping.toFixed(2)}</span>
              </div>

              <Button fullWidth size="lg" onClick={createOrder} loading={loading}>
                Place Order
              </Button>

              <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-gray-600">
                <FiLock className="flex-shrink-0 text-green-600" size={16} />
                <span><strong className="text-gray-900">Secure checkout</strong> — your information is encrypted and safe</span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
