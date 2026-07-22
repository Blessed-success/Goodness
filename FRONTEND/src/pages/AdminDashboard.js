/**
 * Admin Dashboard
 * Main admin page with statistics and overview
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiTrendingUp, FiBox, FiShoppingCart, FiUsers, FiAlertCircle } from 'react-icons/fi';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      const response = await axios.get(`${API_BASE_URL}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setDashboard(response.data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        ❌ {error}
      </div>
    );
  }

  if (!dashboard) return null;

  const stats = dashboard.stats || {};

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-semibold mb-1">{label}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
          <Icon size={24} className={color} />
        </div>
      </div>
    </div>
  );

  return (
      <div className="space-y-6">
        {/* Page Title */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600 mt-1">Welcome to Nexus Admin Panel</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={FiBox}
            label="Total Products"
            value={stats.total_products}
            color="text-blue-600"
          />
          <StatCard
            icon={FiShoppingCart}
            label="Total Orders"
            value={stats.total_orders}
            color="text-green-600"
          />
          <StatCard
            icon={FiUsers}
            label="Total Users"
            value={stats.total_users}
            color="text-purple-600"
          />
          <StatCard
            icon={FiTrendingUp}
            label="Total Revenue"
            value={`GHS ${stats.total_revenue.toFixed(2)}`}
            color="text-orange-600"
          />
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pending Orders Alert */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <FiAlertCircle size={24} className="text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-yellow-900">Pending Orders</h3>
                <p className="text-yellow-700 text-2xl font-bold mt-2">
                  {stats.pending_orders} orders
                </p>
                <a
                  href="/admin/orders?status=pending"
                  className="text-yellow-600 hover:text-yellow-700 font-semibold mt-3 inline-block"
                >
                  View Orders →
                </a>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-bold text-blue-900 mb-2">Recent Activity (7 days)</h3>
            <div className="space-y-2 text-blue-800">
              <p className="text-2xl font-bold">{stats.recent_orders} orders</p>
              <p className="text-sm text-blue-700">
                Click to view detailed order history
              </p>
              <a
                href="/admin/orders"
                className="text-blue-600 hover:text-blue-700 font-semibold mt-3 inline-block"
              >
                View All Orders →
              </a>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          {dashboard.top_products && dashboard.top_products.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold mb-4">Top Selling Products</h3>
              <div className="space-y-3">
                {dashboard.top_products.slice(0, 5).map((product, idx) => (
                  <div key={product.id} className="flex items-center justify-between pb-3 border-b last:border-b-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600">{product.total_quantity} sold</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(product.total_quantity / (dashboard.top_products[0]?.total_quantity || 1)) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Revenue by Day */}
          {dashboard.revenue_by_day && dashboard.revenue_by_day.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold mb-4">Revenue (Last 7 Days)</h3>
              <div className="space-y-3">
                {dashboard.revenue_by_day.map((day) => (
                  <div key={day.date} className="flex items-center justify-between pb-3 border-b last:border-b-0">
                    <p className="text-gray-700 font-medium">{new Date(day.date).toLocaleDateString()}</p>
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${(day.revenue / (Math.max(...dashboard.revenue_by_day.map(r => r.revenue)) || 1)) * 100}%`
                          }}
                        />
                      </div>
                      <span className="text-green-600 font-bold w-20 text-right">
                        GHS {day.revenue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <a
              href="/admin/products/new"
              className="p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-center transition"
            >
              <p className="font-semibold text-blue-600">+ Add Product</p>
              <p className="text-sm text-gray-600">Create new product</p>
            </a>
            <a
              href="/admin/import"
              className="p-4 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg text-center transition"
            >
              <p className="font-semibold text-purple-600">📦 Import Product</p>
              <p className="text-sm text-gray-600">From 1688</p>
            </a>
            <a
              href="/admin/orders?status=pending"
              className="p-4 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg text-center transition"
            >
              <p className="font-semibold text-orange-600">📋 Pending Orders</p>
              <p className="text-sm text-gray-600">{stats.pending_orders} orders</p>
            </a>
            <a
              href="/admin/users"
              className="p-4 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-center transition"
            >
              <p className="font-semibold text-green-600">👥 View Users</p>
              <p className="text-sm text-gray-600">{stats.total_users} total</p>
            </a>
          </div>
        </div>
      </div>
  );
};

export default AdminDashboard;
