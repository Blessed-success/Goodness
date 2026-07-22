/**
 * Vendor Dashboard
 * A marketplace seller's own products, orders, and earnings ledger.
 * Mirrors the admin CRUD UX (Swal feedback, upload-then-save flow) but
 * scoped entirely to the logged-in vendor's own store.
 */

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiExternalLink } from 'react-icons/fi';
import { vendorAPI, productsAPI, uploadAPI } from '../api';
import PlaceholderImage from '../components/ui/PlaceholderImage';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Swal from 'sweetalert2';

const TABS = ['Products', 'Orders', 'Earnings'];

const EMPTY_PRODUCT = {
  name: '', description: '', category: '', price: '', discount_percent: 0,
  stock_quantity: 0, sku: '', image_url: '',
};

const VendorDashboard = () => {
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [loadingVendor, setLoadingVendor] = useState(true);
  const [tab, setTab] = useState('Products');

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [earnings, setEarnings] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    vendorAPI
      .getMe()
      .then((response) => setVendor(response.data.data))
      .catch(() => setVendor(false))
      .finally(() => setLoadingVendor(false));
  }, []);

  useEffect(() => {
    if (!vendor || !vendor.is_approved) return;
    if (tab === 'Products') {
      vendorAPI.getMyProducts().then((res) => setProducts(res.data.data)).catch(() => {});
    } else if (tab === 'Orders') {
      vendorAPI.getMyOrders().then((res) => setOrders(res.data.data)).catch(() => {});
    } else if (tab === 'Earnings') {
      vendorAPI.getMyEarnings().then((res) => setEarnings(res.data.data)).catch(() => {});
    }
  }, [tab, vendor]);

  const refreshProducts = () => vendorAPI.getMyProducts().then((res) => setProducts(res.data.data));

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      const response = await uploadAPI.uploadImage(file, 'products');
      setForm((prev) => ({ ...prev, image_url: response.data.data.url }));
    } catch {
      Swal.fire('Error', 'Failed to upload image', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.category.trim() || !form.price) {
      Swal.fire('Error', 'Name, category, and price are required', 'error');
      return;
    }
    try {
      const payload = { ...form, price: parseFloat(form.price), discount_percent: parseFloat(form.discount_percent) || 0, stock_quantity: parseInt(form.stock_quantity, 10) || 0 };
      if (editingId) {
        await productsAPI.update(editingId, payload);
        Swal.fire('Success', 'Product updated', 'success');
      } else {
        await productsAPI.create(payload);
        Swal.fire('Success', 'Product created', 'success');
      }
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_PRODUCT);
      refreshProducts();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.error || 'Failed to save product', 'error');
    }
  };

  const handleEdit = (product) => {
    setForm({
      name: product.name, description: product.description || '', category: product.category,
      price: product.price, discount_percent: product.discount_percent || 0,
      stock_quantity: product.stock_quantity || 0, sku: product.sku || '', image_url: product.image_url || '',
    });
    setEditingId(product.id);
    setShowForm(true);
  };

  const handleDelete = async (product) => {
    const result = await Swal.fire({
      title: 'Delete Product?', text: `"${product.name}" will be removed.`,
      icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444',
    });
    if (!result.isConfirmed) return;
    try {
      await productsAPI.delete(product.id);
      refreshProducts();
    } catch {
      Swal.fire('Error', 'Failed to delete product', 'error');
    }
  };

  if (loadingVendor) {
    return <div className="py-16 text-center text-gray-500">Loading&hellip;</div>;
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="mx-auto max-w-lg px-4 text-center">
          <Card>
            <p className="mb-4 text-lg text-gray-700">You don't have a vendor store yet.</p>
            <Button onClick={() => navigate('/sell')}>Apply to Sell</Button>
          </Card>
        </div>
      </div>
    );
  }

  if (!vendor.is_approved) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="mx-auto max-w-lg px-4 text-center">
          <Card>
            <p className="text-lg text-gray-700">
              Your application for <strong>{vendor.store_name}</strong> is pending admin approval.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{vendor.store_name}</h1>
            <Link to={`/store/${vendor.slug}`} className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700">
              View storefront <FiExternalLink size={12} />
            </Link>
          </div>
        </div>

        <div className="mb-6 flex gap-2 border-b border-gray-200">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-semibold ${tab === t ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'Products' && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button
                onClick={() => (showForm ? setShowForm(false) : setShowForm(true))}
                className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
              >
                <FiPlus /> Add Product
              </button>
            </div>

            {showForm && (
              <Card>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <input placeholder="Product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2" required />
                    <input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2" required />
                    <input type="number" step="0.01" placeholder="Price (GHS)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2" required />
                    <input type="number" placeholder="Discount %" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2" />
                    <input type="number" placeholder="Stock quantity" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2" />
                    <input placeholder="SKU (optional)" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2" />
                  </div>
                  <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                  <div className="flex items-center gap-4">
                    <input type="file" accept="image/*" onChange={handleImageUpload} />
                    {uploading && <span className="text-sm text-gray-500">Uploading&hellip;</span>}
                    {form.image_url && <PlaceholderImage src={form.image_url} alt="" className="h-14 w-14 rounded object-cover" />}
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit">{editingId ? 'Update' : 'Create'}</Button>
                    <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_PRODUCT); }}>Cancel</Button>
                  </div>
                </form>
              </Card>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <Card key={product.id} padded={false} className="overflow-hidden">
                  <div className="h-32 bg-gray-100">
                    <PlaceholderImage src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">GHS {product.price.toFixed(2)} &middot; {product.stock_quantity} in stock</p>
                    <div className="mt-2 flex gap-3">
                      <button onClick={() => handleEdit(product)} className="text-primary-600 hover:text-primary-700"><FiEdit2 size={15} /></button>
                      <button onClick={() => handleDelete(product)} className="text-red-600 hover:text-red-700"><FiTrash2 size={15} /></button>
                    </div>
                  </div>
                </Card>
              ))}
              {products.length === 0 && <p className="text-gray-500">No products yet — add your first one above.</p>}
            </div>
          </div>
        )}

        {tab === 'Orders' && (
          <Card padded={false} className="overflow-hidden">
            {orders.length === 0 ? (
              <div className="p-6 text-center text-gray-600">No orders yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Qty</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((row) => (
                    <tr key={`${row.order_id}-${row.item.id}`}>
                      <td className="px-4 py-3">{row.order_number}</td>
                      <td className="px-4 py-3">{row.item.product.name}</td>
                      <td className="px-4 py-3">{row.item.quantity}</td>
                      <td className="px-4 py-3 capitalize">{row.order_status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        )}

        {tab === 'Earnings' && earnings && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card><p className="text-sm text-gray-500">Total Earned</p><p className="text-2xl font-bold text-gray-900">GHS {earnings.total_net.toFixed(2)}</p></Card>
              <Card><p className="text-sm text-gray-500">Unpaid Balance</p><p className="text-2xl font-bold text-amber-600">GHS {earnings.unpaid_net.toFixed(2)}</p></Card>
            </div>
            <Card padded={false} className="overflow-hidden">
              {earnings.earnings.length === 0 ? (
                <div className="p-6 text-center text-gray-600">No earnings yet.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Order</th>
                      <th className="px-4 py-3">Net</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {earnings.earnings.map((e) => (
                      <tr key={e.id}>
                        <td className="px-4 py-3">#{e.order_id}</td>
                        <td className="px-4 py-3">GHS {e.net_amount.toFixed(2)}</td>
                        <td className="px-4 py-3 capitalize">{e.payout_status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorDashboard;
