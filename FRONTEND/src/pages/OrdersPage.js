/**
 * Orders Page
 * Lists the logged-in customer's order history.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiPackage, FiChevronRight } from 'react-icons/fi';
import { ordersAPI } from '../api';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Pagination from '../components/ui/Pagination';
import { ORDER_STATUS_VARIANT, formatOrderStatus } from '../utils/orderStatus';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getMyOrders({ page, limit: 10 });
      setOrders(response.data.data.orders);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-4xl px-4">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">My Orders</h1>

        {loading ? (
          <div className="py-16 text-center text-gray-500">Loading orders&hellip;</div>
        ) : orders.length === 0 ? (
          <Card className="py-16 text-center">
            <FiPackage className="mx-auto mb-4 text-gray-300" size={48} />
            <p className="mb-1 text-lg font-semibold text-gray-900">No orders yet</p>
            <p className="text-gray-500">Your order history will show up here.</p>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {orders.map((order) => (
                <Link key={order.id} to={`/orders/${order.id}`}>
                  <Card
                    hoverable
                    padded={false}
                    className="flex items-center justify-between gap-4 p-5"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{order.order_number}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                        {' · '}
                        {order.items?.length || 0} item{order.items?.length === 1 ? '' : 's'}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={ORDER_STATUS_VARIANT[order.status] || 'neutral'}>
                        {formatOrderStatus(order.status)}
                      </Badge>
                      <span className="font-semibold text-gray-900">
                        GHS {order.total_amount.toFixed(2)}
                      </span>
                      <FiChevronRight className="text-gray-400" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            <div className="mt-8">
              <Pagination page={page} pages={pagination.pages} onChange={setPage} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
