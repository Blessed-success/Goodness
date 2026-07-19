/**
 * Competitor Price Tracking Page
 * Admin dashboard for monitoring competitor prices and managing tracking
 */

import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiRefreshCw, FiTrendingDown, FiTrendingUp, FiTarget } from 'react-icons/fi';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const CompetitorTrackingPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, tracking, alerts
  const [dashboard, setDashboard] = useState(null);
  const [tracking, setTracking] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadDashboard();
    loadProducts();
    loadTracking();
    loadAlerts();
  }, []);

  const loadDashboard = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE_URL}/competitor/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboard(response.data.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    }
  };

  const loadTracking = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE_URL}/competitor/tracking`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTracking(response.data.data.tracking);
    } catch (err) {
      console.error('Failed to load tracking:', err);
    }
  };

  const loadAlerts = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE_URL}/competitor/alerts?status=pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlerts(response.data.data.alerts);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    }
  };

  const loadProducts = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE_URL}/products?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data.data.products || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  const handleUpdateAllPrices = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(`${API_BASE_URL}/competitor/update-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess(response.data.message);
      loadDashboard();
      loadTracking();
      loadAlerts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update prices');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🏪 Competitor Price Tracking</h1>
          <p className="text-gray-600">Monitor competitor prices and stay competitive in the market</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            ❌ {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-4 border-b overflow-x-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`pb-3 px-4 font-semibold transition whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => setActiveTab('tracking')}
            className={`pb-3 px-4 font-semibold transition whitespace-nowrap ${
              activeTab === 'tracking'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🎯 Tracking ({tracking.length})
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`pb-3 px-4 font-semibold transition whitespace-nowrap ${
              activeTab === 'alerts'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🚨 Alerts ({alerts.length})
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <DashboardTab
            dashboard={dashboard}
            onUpdateAll={handleUpdateAllPrices}
            loading={loading}
          />
        )}

        {/* Tracking Tab */}
        {activeTab === 'tracking' && (
          <TrackingTab
            tracking={tracking}
            products={products}
            onRefresh={loadTracking}
            onAdd={() => setShowAddModal(true)}
          />
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <AlertsTab
            alerts={alerts}
            onRefresh={loadAlerts}
          />
        )}

        {/* Add Tracking Modal */}
        {showAddModal && (
          <AddTrackingModal
            products={products}
            onClose={() => setShowAddModal(false)}
            onSuccess={() => {
              setShowAddModal(false);
              loadTracking();
              loadDashboard();
            }}
          />
        )}
      </div>
    </div>
  );
};

// Dashboard Component
const DashboardTab = ({ dashboard, onUpdateAll, loading }) => {
  if (!dashboard) {
    return <div className="text-center py-12">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Active Tracking</p>
              <p className="text-3xl font-bold text-blue-600">{dashboard.summary.total_tracking}</p>
            </div>
            <FiTarget className="text-blue-600 text-2xl" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pending Alerts</p>
              <p className="text-3xl font-bold text-orange-600">{dashboard.summary.pending_alerts}</p>
            </div>
            <FiTrendingDown className="text-orange-600 text-2xl" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Undercut Products</p>
              <p className="text-3xl font-bold text-red-600">{dashboard.summary.undercut_products}</p>
            </div>
            <FiTrendingDown className="text-red-600 text-2xl" />
          </div>
        </div>
      </div>

      {/* Update All Button */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold mb-2">Update All Competitor Prices</h3>
            <p className="text-gray-600">Check all tracked competitors for price changes</p>
          </div>
          <button
            onClick={onUpdateAll}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 flex items-center gap-2"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            {loading ? 'Updating...' : 'Update All Prices'}
          </button>
        </div>
      </div>

      {/* Recent Alerts */}
      {dashboard.recent_alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">Recent Alerts</h3>
          <div className="space-y-3">
            {dashboard.recent_alerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="border border-orange-200 rounded p-3 bg-orange-50">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900">{alert.product_name}</p>
                    <p className="text-sm text-gray-600">{alert.competitor_name} - {alert.alert_type}</p>
                    <p className="text-sm text-orange-700 mt-1">{alert.recommendation}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(alert.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Undercut Products */}
      {dashboard.undercut_products.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4 text-red-700">⚠️ Products Being Undercut</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Product</th>
                  <th className="text-right py-2">Your Price</th>
                  <th className="text-right py-2">Competitor</th>
                  <th className="text-right py-2">Difference</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.undercut_products.map((product, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2">{product.product_name}</td>
                    <td className="text-right py-2">GHS {product.your_price.toFixed(2)}</td>
                    <td className="text-right py-2">GHS {product.competitor_price.toFixed(2)}</td>
                    <td className="text-right py-2 text-red-600 font-semibold">
                      -GHS {product.difference.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Tracking Component
const TrackingTab = ({ tracking, products, onRefresh, onAdd }) => {
  const [filter, setFilter] = useState('');

  const filteredTracking = tracking.filter(t =>
    t.product_name?.toLowerCase().includes(filter.toLowerCase()) ||
    t.competitor_name?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search products or competitors..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={onRefresh}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
          >
            <FiRefreshCw /> Refresh
          </button>
        </div>
        <button
          onClick={onAdd}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
        >
          <FiPlus /> Add Tracking
        </button>
      </div>

      {/* Tracking Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4">Product</th>
                <th className="text-left py-3 px-4">Competitor</th>
                <th className="text-right py-3 px-4">Your Price</th>
                <th className="text-right py-3 px-4">Competitor Price</th>
                <th className="text-right py-3 px-4">Difference</th>
                <th className="text-center py-3 px-4">Status</th>
                <th className="text-center py-3 px-4">Last Check</th>
                <th className="text-center py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTracking.map((track) => (
                <tr key={track.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-semibold">{track.product_name}</p>
                      <p className="text-xs text-gray-500">ID: {track.product_id}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-semibold">{track.competitor_name}</p>
                      <a
                        href={track.competitor_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View Product
                      </a>
                    </div>
                  </td>
                  <td className="text-right py-3 px-4 font-semibold">
                    GHS {track.product?.price?.toFixed(2) || 'N/A'}
                  </td>
                  <td className="text-right py-3 px-4">
                    {track.competitor_price ? `GHS ${track.competitor_price.toFixed(2)}` : 'Not checked'}
                  </td>
                  <td className="text-right py-3 px-4">
                    {track.price_difference !== null ? (
                      <span className={track.price_difference > 0 ? 'text-green-600' : 'text-red-600'}>
                        {track.price_difference > 0 ? '+' : ''}GHS {track.price_difference.toFixed(2)}
                      </span>
                    ) : 'N/A'}
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      track.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {track.is_available ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4 text-xs text-gray-500">
                    {track.last_checked ? new Date(track.last_checked).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="text-center py-3 px-4">
                    <button className="text-blue-600 hover:text-blue-800 mr-2">
                      <FiEdit size={16} />
                    </button>
                    <button className="text-red-600 hover:text-red-800">
                      <FiTrash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTracking.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No competitor tracking found</p>
            <button
              onClick={onAdd}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Add Your First Tracking
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Alerts Component
const AlertsTab = ({ alerts, onRefresh }) => {
  const handleUpdateAlert = async (alertId, status) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.put(`${API_BASE_URL}/competitor/alerts/${alertId}`, {
        status,
        admin_notes: status === 'reviewed' ? 'Reviewed by admin' : ''
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onRefresh();
    } catch (err) {
      console.error('Failed to update alert:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Price Change Alerts</h2>
        <button
          onClick={onRefresh}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
        >
          <FiRefreshCw /> Refresh
        </button>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {alerts.map((alert) => (
          <div key={alert.id} className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{alert.product_name}</h3>
                <p className="text-sm text-gray-600">{alert.competitor_name} - {alert.alert_type}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleUpdateAlert(alert.id, 'reviewed')}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition"
                >
                  Mark Reviewed
                </button>
                <button
                  onClick={() => handleUpdateAlert(alert.id, 'dismissed')}
                  className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition"
                >
                  Dismiss
                </button>
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg mb-4">
              <p className="text-orange-800 font-semibold mb-2">💡 Recommendation</p>
              <p className="text-orange-700">{alert.recommendation}</p>
            </div>

            {alert.price_gap_change && (
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Old Competitor Price</p>
                  <p className="font-semibold">GHS {alert.old_competitor_price?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600">New Competitor Price</p>
                  <p className="font-semibold">GHS {alert.new_competitor_price?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Price Gap Change</p>
                  <p className={`font-semibold ${alert.price_gap_change > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {alert.price_gap_change > 0 ? '+' : ''}GHS {alert.price_gap_change.toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-4 text-xs text-gray-500">
              Created: {new Date(alert.created_at).toLocaleString()}
            </div>
          </div>
        ))}

        {alerts.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg">No pending alerts</p>
            <p className="text-gray-400 text-sm">All competitor prices are within acceptable ranges</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Add Tracking Modal
const AddTrackingModal = ({ products, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    product_id: '',
    competitor_url: '',
    competitor_name: '',
    check_frequency_hours: 24
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`${API_BASE_URL}/competitor/tracking`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add tracking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Add Competitor Tracking</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Your Product</label>
              <select
                value={formData.product_id}
                onChange={(e) => setFormData({...formData, product_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                required
              >
                <option value="">Select a product...</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - GHS {product.price}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Competitor URL</label>
              <input
                type="url"
                value={formData.competitor_url}
                onChange={(e) => setFormData({...formData, competitor_url: e.target.value})}
                placeholder="https://jumia.com.gh/product/..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                URL of the competitor's product page (Jumia, AliExpress, etc.)
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Competitor Name</label>
              <input
                type="text"
                value={formData.competitor_name}
                onChange={(e) => setFormData({...formData, competitor_name: e.target.value})}
                placeholder="Jumia, AliExpress, Amazon..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave blank to auto-detect from URL
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Check Frequency (hours)</label>
              <select
                value={formData.check_frequency_hours}
                onChange={(e) => setFormData({...formData, check_frequency_hours: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value={6}>Every 6 hours</option>
                <option value={12}>Every 12 hours</option>
                <option value={24}>Every 24 hours</option>
                <option value={48}>Every 48 hours</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Tracking'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompetitorTrackingPage;