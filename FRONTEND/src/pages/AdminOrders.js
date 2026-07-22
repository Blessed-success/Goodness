/**
 * Admin Orders Management
 * View and manage orders, update status
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { automationAPI } from '../api';
import { FiEye, FiCheckCircle, FiSearch, FiSend } from 'react-icons/fi';
import Swal from 'sweetalert2';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [forwardMessages, setForwardMessages] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [page, status, search]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      const response = await axios.get(`${API_BASE_URL}/admin/orders`, {
        params: { page, limit: 10, status, search },
        headers: { Authorization: `Bearer ${token}` }
      });

      setOrders(response.data.data.orders);
      setTotalPages(response.data.data.pagination.pages);
    } catch (err) {
      Swal.fire('Error', 'Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (orderId) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE_URL}/admin/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSelectedOrder(response.data.data);
      setShowDetails(true);
    } catch (err) {
      Swal.fire('Error', 'Failed to load order details', 'error');
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('access_token');

      await axios.put(
        `${API_BASE_URL}/admin/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire('Success', 'Order status updated', 'success');
      fetchOrders();
      setShowDetails(false);
    } catch (err) {
      Swal.fire('Error', 'Failed to update status', 'error');
    }
  };

  const handleForwardToSupplier = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await automationAPI.forwardOrderToSupplier(selectedOrder.id, {
        supplier_contact: selectedOrder.shipping_phone,
        delivery_fee: selectedOrder.shipping_cost
      });

      setForwardMessages(response.data.data);
      Swal.fire('Success', 'Supplier forwarding prepared', 'success');
    } catch (err) {
      Swal.fire('Error', err.response?.data?.error || 'Failed to forward order', 'error');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentColor = (status) => {
    return status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  const statusOptions = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Orders</h2>
          <p className="text-gray-600 mt-1">Manage customer orders and shipping</p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order number or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="">All Status</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-6 text-center text-gray-600">Loading...</div>
          ) : orders.length === 0 ? (
            <div className="p-6 text-center text-gray-600">No orders found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Order</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Customer</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Items</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Amount</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Payment</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-sm">{order.order_number}</p>
                          <p className="text-xs text-gray-500">ID: {order.id}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <p className="font-medium">{order.user_email}</p>
                      </td>
                      <td className="px-6 py-4 text-sm">{order.items_count} items</td>
                      <td className="px-6 py-4 text-sm font-semibold">
                        GHS {order.total_amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPaymentColor(order.payment_status)}`}>
                          {order.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleViewDetails(order.id)}
                          className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          <FiEye size={18} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white w-full max-h-[90vh] overflow-y-auto rounded-t-lg">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
              <h3 className="text-xl font-bold">Order {selectedOrder.order_number}</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-semibold">{selectedOrder.user.full_name}</p>
                  <p className="text-sm text-gray-600">{selectedOrder.user.email}</p>
                  <p className="text-sm text-gray-600">{selectedOrder.user.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Shipping Address</p>
                  <p className="font-semibold">{selectedOrder.user.address}</p>
                  <p className="text-sm text-gray-600 mt-2">Delivery Address:</p>
                  <p className="text-sm">{selectedOrder.shipping_address}</p>
                </div>
              </div>

              {/* Status Update */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Update Status</label>
                  <div className="flex gap-2 flex-wrap">
                    {statusOptions.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(selectedOrder.id, s)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                          selectedOrder.status === s
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-300 hover:border-blue-500'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Current: <span className={`font-semibold ${getStatusColor(selectedOrder.status)}`}>{selectedOrder.status}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Dropshipping</label>
                  <button
                    onClick={handleForwardToSupplier}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                  >
                    <FiSend className="inline-block mr-2" /> Prepare Supplier Forwarding
                  </button>
                  {forwardMessages && (
                    <div className="mt-3 bg-white rounded-lg border border-green-100 p-4 text-sm text-gray-700">
                      <p className="font-semibold mb-2">Supplier Messages Ready</p>
                      <p className="font-medium">WhatsApp Message:</p>
                      <pre className="whitespace-pre-wrap bg-gray-50 p-3 rounded mt-2 text-xs">{forwardMessages.whatsapp_message}</pre>
                      <p className="font-medium mt-3">Email Message:</p>
                      <pre className="whitespace-pre-wrap bg-gray-50 p-3 rounded mt-2 text-xs">{forwardMessages.email_message}</pre>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-bold text-lg mb-3">Items</h4>
                <div className="space-y-3">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-4 flex justify-between">
                      <div>
                        <p className="font-semibold">{item.product.name}</p>
                        <p className="text-sm text-gray-600">SKU: {item.product.sku}</p>
                        <p className="text-sm mt-1">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">GHS {item.price_at_purchase.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">Total: GHS {item.subtotal.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">Order Total:</span>
                  <span className="text-2xl font-bold text-blue-600">GHS {selectedOrder.total_amount.toFixed(2)}</span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Payment Status: <span className={`font-semibold ${getPaymentColor(selectedOrder.payment_status)}`}>{selectedOrder.payment_status}</span></p>
                  <p>Order Date: {new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <p className="text-sm font-semibold text-yellow-800">Customer Notes:</p>
                  <p className="text-sm text-yellow-700 mt-1">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminOrders;
