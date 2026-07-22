/**
 * Order Detail Page
 * Shows a single order's items, shipping info, and status.
 * This is the page checkout redirects to after a successful purchase.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { ordersAPI } from '../api';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import PlaceholderImage from '../components/ui/PlaceholderImage';
import { toast } from '../components/ui/Toast';
import { ORDER_STATUS_VARIANT, formatOrderStatus } from '../utils/orderStatus';

const CANCELLABLE_STATUSES = ['pending', 'processing'];
const TRACKING_STEPS = ['pending', 'processing', 'shipped', 'delivered'];

const OrderTracker = ({ status }) => {
  if (status === 'cancelled') {
    return (
      <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
        This order was cancelled.
      </div>
    );
  }

  const currentIndex = TRACKING_STEPS.indexOf(status);

  return (
    <div className="mb-6 flex items-center">
      {TRACKING_STEPS.map((step, index) => {
        const reached = index <= currentIndex;
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  reached ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {index + 1}
              </div>
              <span className={`mt-1 text-xs capitalize ${reached ? 'font-semibold text-primary-700' : 'text-gray-400'}`}>
                {step}
              </span>
            </div>
            {index < TRACKING_STEPS.length - 1 && (
              <div className={`mx-2 h-0.5 flex-1 ${index < currentIndex ? 'bg-primary-600' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const OrderDetailPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getOrder(id);
      setOrder(response.data.data);
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleCancel = async () => {
    const confirmed = await toast.confirm('This order will be cancelled.', {
      title: 'Cancel this order?',
      confirmText: 'Cancel order',
      danger: true,
    });
    if (!confirmed) return;

    try {
      setCancelling(true);
      await ordersAPI.cancel(id);
      toast.success('Order cancelled');
      fetchOrder();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return <div className="py-24 text-center text-gray-500">Loading order&hellip;</div>;
  }

  if (!order) {
    return (
      <div className="py-24 text-center">
        <p className="mb-4 text-gray-600">Order not found.</p>
        <Link to="/orders" className="font-semibold text-primary-600 hover:text-primary-700">
          Back to orders
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-3xl px-4">
        <Link
          to="/orders"
          className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-primary-600"
        >
          <FiArrowLeft /> Back to orders
        </Link>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{order.order_number}</h1>
            <p className="text-sm text-gray-500">
              Placed on{' '}
              {new Date(order.created_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <Badge variant={ORDER_STATUS_VARIANT[order.status] || 'neutral'} className="text-sm">
            {formatOrderStatus(order.status)}
          </Badge>
        </div>

        <Card className="mb-6">
          <OrderTracker status={order.status} />
        </Card>

        <Card className="mb-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Items</h2>
          <div className="divide-y divide-gray-100">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  <PlaceholderImage
                    src={item.product.image_url}
                    alt={item.product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.product.name}</p>
                  <p className="text-sm text-gray-500">
                    Qty {item.quantity} &times; GHS {item.price_at_purchase.toFixed(2)}
                  </p>
                </div>
                <p className="font-semibold text-gray-900">GHS {item.subtotal.toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Items total</span>
              <span>GHS {order.item_total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span>GHS {order.shipping_cost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-gray-900">
              <span>Total</span>
              <span>GHS {order.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </Card>

        <Card className="mb-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Shipping details</h2>
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-gray-500">Address</dt>
              <dd className="font-medium text-gray-900">{order.shipping_address}</dd>
            </div>
            <div>
              <dt className="text-gray-500">City</dt>
              <dd className="font-medium text-gray-900">{order.shipping_city}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Phone</dt>
              <dd className="font-medium text-gray-900">{order.shipping_phone}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Payment method</dt>
              <dd className="font-medium capitalize text-gray-900">{order.payment_method}</dd>
            </div>
          </dl>
          {order.notes && (
            <div className="mt-3 border-t border-gray-100 pt-3 text-sm">
              <dt className="text-gray-500">Notes</dt>
              <dd className="text-gray-900">{order.notes}</dd>
            </div>
          )}
        </Card>

        {CANCELLABLE_STATUSES.includes(order.status) && (
          <Button variant="danger" loading={cancelling} onClick={handleCancel}>
            Cancel order
          </Button>
        )}
      </div>
    </div>
  );
};

export default OrderDetailPage;
