/**
 * Admin Ads Generator
 * Generate Facebook ad variations for products
 */

import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import AdminLayout from '../components/AdminLayout';
import { automationAPI } from '../api';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AdminAdsPage = () => {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE_URL}/admin/products`, {
        params: { page: 1, limit: 100 },
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data.data.products);
    } catch (err) {
      Swal.fire('Error', 'Could not load products', 'error');
    }
  };

  const handleGenerateAds = async () => {
    if (!selectedProductId) {
      Swal.fire('Warning', 'Please select a product first', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await automationAPI.generateAds(selectedProductId, { count: 4 });
      setAds(response.data.data);
      Swal.fire('Success', 'Ads generated successfully', 'success');
    } catch (err) {
      Swal.fire('Error', err.response?.data?.error || 'Failed to generate ads', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Facebook Ads Generator</h2>
          <p className="text-gray-600 mt-1">Create high-converting ad copies for your top products.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <label className="block text-sm font-semibold mb-2">Choose Product</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} - GHS {product.price.toFixed(2)}
                </option>
              ))}
            </select>

            <button
              onClick={handleGenerateAds}
              disabled={!selectedProductId || loading}
              className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate Ads'}
            </button>
          </div>

          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4">Generated Ad Variations</h3>
            {ads.length === 0 ? (
              <p className="text-gray-500">No ads generated yet. Select a product and click Generate Ads.</p>
            ) : (
              <div className="space-y-4">
                {ads.map((ad) => (
                  <div key={ad.id} className="border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Variation {ad.variation_index}</p>
                    <h4 className="text-xl font-semibold mt-2">{ad.headline}</h4>
                    <p className="mt-3 text-gray-700">{ad.primary_text}</p>
                    <div className="mt-3 flex items-center justify-between gap-3 text-sm text-gray-600">
                      <span>CTA: {ad.call_to_action}</span>
                      <span>{ad.hashtags}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAdsPage;
