/**
 * Negotiation Assistant
 * Generate supplier negotiation messages in English and Chinese.
 */

import React, { useState } from 'react';
import Swal from 'sweetalert2';
import AdminLayout from '../components/AdminLayout';
import { automationAPI } from '../api';

const NegotiationAssistantPage = () => {
  const [formData, setFormData] = useState({
    product_name: '',
    supplier_name: '',
    current_price: ''
  });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.product_name) {
      Swal.fire('Warning', 'Product name is required', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await automationAPI.generateNegotiationMessage({
        product_name: formData.product_name,
        supplier_name: formData.supplier_name,
        current_price: Number(formData.current_price || 0)
      });
      setMessage(response.data.data);
      Swal.fire('Success', 'Negotiation message generated', 'success');
    } catch (err) {
      Swal.fire('Error', err.response?.data?.error || 'Failed to generate message', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Supplier Negotiation Assistant</h2>
          <p className="text-gray-600 mt-1">Create polite, effective messages for 1688 suppliers.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Product Name</label>
              <input
                type="text"
                value={formData.product_name}
                onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Supplier Name</label>
              <input
                type="text"
                value={formData.supplier_name}
                onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="e.g. 1688 Supplier"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Current Price</label>
              <input
                type="number"
                step="0.01"
                value={formData.current_price}
                onChange={(e) => setFormData({ ...formData, current_price: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="GHS"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate Negotiation Message'}
            </button>
          </form>

          <div className="lg:col-span-2 space-y-4">
            {message ? (
              <div className="bg-white rounded-lg shadow p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">English Message</h3>
                  <div className="mt-2 whitespace-pre-line text-gray-700 bg-gray-50 p-4 rounded-lg">
                    {message.english_message}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Chinese Message</h3>
                  <div className="mt-2 whitespace-pre-line text-gray-700 bg-gray-50 p-4 rounded-lg">
                    {message.chinese_message}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Bulk Order Message</h3>
                  <div className="mt-2 whitespace-pre-line text-gray-700 bg-gray-50 p-4 rounded-lg">
                    {message.bulk_order_message}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-gray-600">
                Fill in the product and supplier details to generate a negotiation message.
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default NegotiationAssistantPage;
