/**
 * Vendor Apply Page
 * Lets a logged-in customer apply to become a marketplace seller
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiShoppingBag } from 'react-icons/fi';
import { vendorAPI } from '../api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { toast } from '../components/ui/Toast';

const VendorApplyPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ store_name: '', description: '', whatsapp_number: '' });
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    vendorAPI
      .getMe()
      .then(() => navigate('/vendor/dashboard'))
      .catch(() => setChecking(false));
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.store_name.trim()) {
      toast.error('Store name is required');
      return;
    }
    try {
      setSubmitting(true);
      await vendorAPI.apply(form);
      toast.success('Application submitted — pending admin approval');
      navigate('/vendor/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return <div className="py-16 text-center text-gray-500">Loading&hellip;</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-lg px-4">
        <Card>
          <div className="mb-6 text-center">
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
              <FiShoppingBag className="text-primary-700" size={22} />
            </span>
            <h1 className="text-2xl font-bold text-gray-900">Sell on Nexus</h1>
            <p className="mt-1 text-sm text-gray-500">
              Apply to open your own store. An admin will review your application before you can list products.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Store Name *</label>
              <input
                type="text"
                value={form.store_name}
                onChange={(e) => setForm({ ...form, store_name: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-primary-400 focus:outline-none"
                placeholder="e.g. Kojo's Electronics"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-primary-400 focus:outline-none"
                placeholder="Tell shoppers what you sell..."
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">WhatsApp Number</label>
              <input
                type="text"
                value={form.whatsapp_number}
                onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-primary-400 focus:outline-none"
                placeholder="+233..."
              />
            </div>
            <Button type="submit" fullWidth loading={submitting}>
              Submit Application
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default VendorApplyPage;
