/**
 * Price Monitor Admin Dashboard
 * Manage product price alerts and price tracking
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiRefreshCw, FiAlertTriangle, FiCheck, FiX, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const PriceMonitorDashboard = () => {
  const [activeTab, setActiveTab] = useState('alerts'); // alerts, monitored, status
  const [alerts, setAlerts] = useState([]);
  const [monitoredProducts, setMonitoredProducts] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('pending');

  useEffect(() => {
    if (activeTab === 'alerts') {
      loadAlerts();
    } else if (activeTab === 'monitored') {
      loadMonitoredProducts();
    } else if (activeTab === 'status') {
      loadStatus();
    }
  }, [activeTab, page, statusFilter]);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE_URL}/price-monitor/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatus(response.data.data);
    } catch (err) {
      setError('Failed to load status');
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.get(
        `${API_BASE_URL}/price-monitor/alerts?status=${statusFilter}&page=${page}&limit=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAlerts(response.data.data.alerts);
    } catch (err) {
      setError('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const loadMonitoredProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.get(
        `${API_BASE_URL}/price-monitor/products/monitored?page=${page}&limit=20`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMonitoredProducts(response.data.data.products);
    } catch (err) {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const triggerManualCheck = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `${API_BASE_URL}/price-monitor/manual-check`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const result = response.data.data;
      setSuccess(
        `Price check completed: ${result.prices_updated} updated, ` +
        `${result.alerts_created} alerts created, ${result.errors} errors`
      );
      
      setTimeout(() => {
        loadAlerts();
        loadStatus();
        setSuccess('');
      }, 1000);
    } catch (err) {
      setError('Manual price check failed');
    } finally {
      setLoading(false);
    }
  };

  const approveAlert = async (alertId) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(
        `${API_BASE_URL}/price-monitor/alerts/${alertId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccess('Alert approved and price updated');
      setTimeout(() => {
        loadAlerts();
        loadStatus();
        setSuccess('');
      }, 1000);
    } catch (err) {
      setError('Failed to approve alert');
    }
  };

  const dismissAlert = async (alertId) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(
        `${API_BASE_URL}/price-monitor/alerts/${alertId}/dismiss`,
        { notes: 'Dismissed by admin' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccess('Alert dismissed');
      setTimeout(() => {
        loadAlerts();
        loadStatus();
        setSuccess('');
      }, 1000);
    } catch (err) {
      setError('Failed to dismiss alert');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📊 Price Monitor Dashboard</h1>
          <p className="text-gray-600">Automatically track and manage supplier price changes</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            ❌ {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            ✅ {success}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-4 border-b">
          <button
            onClick={() => { setActiveTab('alerts'); setPage(1); }}
            className={`pb-3 px-4 font-semibold transition ${
              activeTab === 'alerts'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🚨 Price Alerts
          </button>
          <button
            onClick={() => { setActiveTab('monitored'); setPage(1); }}
            className={`pb-3 px-4 font-semibold transition ${
              activeTab === 'monitored'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📦 Monitored Products
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`pb-3 px-4 font-semibold transition ${
              activeTab === 'status'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ⚙️ Status & Config
          </button>
        </div>

        {/* Price Alerts Tab */}
        {activeTab === 'alerts' && (
          <AlertsSection
            alerts={alerts}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            loading={loading}
            onApprove={approveAlert}
            onDismiss={dismissAlert}
          />
        )}

        {/* Monitored Products Tab */}
        {activeTab === 'monitored' && (
          <MonitoredProductsSection
            products={monitoredProducts}
            loading={loading}
          />
        )}

        {/* Status Tab */}
        {activeTab === 'status' && (
          <StatusSection
            status={status}
            loading={loading}
            onManualCheck={triggerManualCheck}
          />
        )}
      </div>
    </div>
  );
};

// Alerts Section Component
const AlertsSection = ({ alerts, statusFilter, setStatusFilter, loading, onApprove, onDismiss }) => {
  const getAlertColor = (increase) => {
    return increase ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200';
  };

  const getAlertIcon = (increase) => {
    return increase ? (
      <FiTrendingUp className="text-red-600 text-xl" />
    ) : (
      <FiTrendingDown className="text-green-600 text-xl" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {['pending', 'auto_updated', 'approved', 'dismissed'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg transition font-semibold ${
              statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
            }`}
          >
            {status.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading alerts...</div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No alerts found</div>
      ) : (
        alerts.map((alert) => (
          <div
            key={alert.id}
            className={`border rounded-lg p-6 ${getAlertColor(alert.is_increase)}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                {getAlertIcon(alert.is_increase)}
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {alert.product_name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {alert.alert_type === 'price_increase' ? '📈 Price Increased' : '📉 Price Decreased'}
                  </p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                alert.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                alert.status === 'auto_updated' ? 'bg-green-100 text-green-800' :
                alert.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {alert.status.replace('_', ' ').toUpperCase()}
              </div>
            </div>

            {/* Price Details */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Original Price (RMB)</p>
                <p className="text-xl font-bold text-gray-900">¥{alert.old_price_rmb.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">New Price (RMB)</p>
                <p className="text-xl font-bold text-gray-900">¥{alert.new_price_rmb.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Store Price (GHS)</p>
                <p className="text-xl font-bold text-gray-900">GHS {alert.old_price_ghs.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">New Store Price (GHS)</p>
                <p className="text-xl font-bold text-gray-900">GHS {alert.new_price_ghs.toFixed(2)}</p>
              </div>
            </div>

            {/* Change Percent */}
            <div className={`inline-block px-3 py-1 rounded-lg font-bold mb-4 ${
              alert.is_increase
                ? 'bg-red-200 text-red-800'
                : 'bg-green-200 text-green-800'
            }`}>
              {alert.is_increase ? '🔴' : '🟢'} {Math.abs(alert.price_change_percent).toFixed(2)}% {
                alert.is_increase ? 'Increase' : 'Decrease'
              }
            </div>

            {/* Actions */}
            {alert.status === 'pending' && (
              <div className="flex gap-2">
                {alert.alert_type === 'price_decrease' && (
                  <button
                    onClick={() => onApprove(alert.id)}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition font-semibold flex items-center justify-center gap-2"
                  >
                    <FiCheck /> Approve & Apply
                  </button>
                )}
                {alert.alert_type === 'price_increase' && (
                  <>
                    <button
                      onClick={() => onApprove(alert.id)}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition font-semibold flex items-center justify-center gap-2"
                    >
                      <FiCheck /> Approve Change
                    </button>
                    <button
                      onClick={() => onDismiss(alert.id)}
                      className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition font-semibold flex items-center justify-center gap-2"
                    >
                      <FiX /> Dismiss
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Auto-updated note */}
            {alert.auto_update_applied && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                ✅ Price automatically updated on {new Date(alert.updated_at).toLocaleString()}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

// Monitored Products Section
const MonitoredProductsSection = ({ products, loading }) => {
  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        {products.length} products being monitored
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading products...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No monitored products</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {products.map((product) => (
            <div key={product.id} className="bg-white border rounded-lg p-4">
              <h3 className="font-bold text-gray-900 mb-2">{product.name}</h3>
              
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Price (GHS)</span>
                  <span className="font-bold text-gray-900">{product.price?.toFixed(2) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Supplier (RMB)</span>
                  <span className="font-bold text-gray-900">
                    {product.supplier_price_rmb ? `¥${product.supplier_price_rmb.toFixed(2)}` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Profit Margin</span>
                  <span className="font-bold text-gray-900">{product.profit_margin_percent || 40}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Checked</span>
                  <span className="font-bold text-gray-900">
                    {product.last_scraped_at
                      ? new Date(product.last_scraped_at).toLocaleString()
                      : 'Never'}
                  </span>
                </div>
              </div>

              {product.pending_alerts > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-800">
                  ⚠️ {product.pending_alerts} pending alert(s)
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Status Section
const StatusSection = ({ status, loading, onManualCheck }) => {
  if (loading || !status) {
    return <div className="text-center py-8 text-gray-500">Loading status...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Manual Check Button */}
      <button
        onClick={onManualCheck}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition font-bold flex items-center justify-center gap-2 text-lg"
      >
        <FiRefreshCw /> Run Price Check Now
      </button>

      {/* Scheduler Status */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">⚙️ Scheduler Status</h3>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-1">Status</p>
          <p className={`text-lg font-bold ${
            status.scheduler?.status === 'running' ? 'text-green-600' : 'text-red-600'
          }`}>
            {status.scheduler?.status === 'running' ? '🟢 RUNNING' : '🔴 STOPPED'}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-600 mb-2">Scheduled Jobs</p>
          <div className="space-y-2">
            {status.scheduler?.jobs?.map((job, idx) => (
              <div key={idx} className="bg-gray-50 p-3 rounded">
                <p className="font-semibold text-gray-900">{job.name}</p>
                <p className="text-xs text-gray-600">
                  Next run: {job.next_run
                    ? new Date(job.next_run).toLocaleString()
                    : 'Not scheduled'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Monitored Products"
          value={status.stats?.total_monitored_products || 0}
          icon="📦"
        />
        <StatCard
          label="Pending Alerts"
          value={status.stats?.pending_alerts || 0}
          icon="🚨"
          warning={status.stats?.pending_alerts > 0}
        />
        <StatCard
          label="Price Increases"
          value={status.stats?.price_increases || 0}
          icon="📈"
        />
        <StatCard
          label="Price Decreases"
          value={status.stats?.price_decreases || 0}
          icon="📉"
        />
      </div>

      {/* Highest Changes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-sm text-red-600 font-semibold mb-2">Highest Price Increase</p>
          <p className="text-3xl font-bold text-red-800">
            {status.stats?.highest_increase_percent?.toFixed(2) || 0}%
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <p className="text-sm text-green-600 font-semibold mb-2">Highest Price Decrease</p>
          <p className="text-3xl font-bold text-green-800">
            {status.stats?.highest_decrease_percent?.toFixed(2) || 0}%
          </p>
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ label, value, icon, warning = false }) => (
  <div className={`${
    warning ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'
  } border rounded-lg p-4`}>
    <p className="text-lg">{icon}</p>
    <p className="text-sm text-gray-600 mt-2">{label}</p>
    <p className={`text-2xl font-bold ${
      warning ? 'text-yellow-600' : 'text-gray-900'
    }`}>
      {value}
    </p>
  </div>
);

export default PriceMonitorDashboard;
