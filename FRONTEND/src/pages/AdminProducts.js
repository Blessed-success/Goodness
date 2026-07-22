/**
 * Admin Products Management
 * Add, edit, delete, and manage products
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { automationAPI, categoriesAPI } from '../api';
import { FiEdit2, FiTrash2, FiPlus, FiSearch, FiImage } from 'react-icons/fi';
import PlaceholderImage from '../components/ui/PlaceholderImage';
import Swal from 'sweetalert2';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(null);
  const [categoryNames, setCategoryNames] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Wholesale',
    price: '',
    discount_percent: '',
    image_url: '',
    stock_quantity: '',
    rating: '5.0',
    is_featured: false,
    is_trending: false,
    is_flash_sale: false
  });

  useEffect(() => {
    fetchProducts();
  }, [page, search]);

  useEffect(() => {
    categoriesAPI.getAll()
      .then((res) => setCategoryNames(res.data.data.map((c) => c.name)))
      .catch(() => {});
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      const response = await axios.get(`${API_BASE_URL}/admin/products`, {
        params: { page, limit: 10, search },
        headers: { Authorization: `Bearer ${token}` }
      });

      setProducts(response.data.data.products);
      setTotalPages(response.data.data.pagination.pages);
    } catch (err) {
      Swal.fire('Error', 'Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingImage('uploading');
      const token = localStorage.getItem('access_token');
      const formDataImage = new FormData();
      formDataImage.append('file', file);

      const response = await axios.post(
        `${API_BASE_URL}/admin/upload-image`,
        formDataImage,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setFormData({ ...formData, image_url: response.data.data.url });
      setUploadingImage('success');
      setTimeout(() => setUploadingImage(null), 2000);
    } catch (err) {
      Swal.fire('Error', 'Failed to upload image', 'error');
      setUploadingImage(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.category) {
      Swal.fire('Error', 'Please fill in required fields', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');

      if (editingId) {
        await axios.put(`${API_BASE_URL}/admin/products/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Swal.fire('Success', 'Product updated successfully', 'success');
      } else {
        await axios.post(`${API_BASE_URL}/admin/products`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Swal.fire('Success', 'Product created successfully', 'success');
      }

      resetForm();
      fetchProducts();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.error || 'Failed to save product', 'error');
    }
  };

  const handleEdit = async (id) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE_URL}/admin/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setFormData(response.data.data);
      setEditingId(id);
      setShowForm(true);
    } catch (err) {
      Swal.fire('Error', 'Failed to load product', 'error');
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Product?',
      text: 'This action cannot be undone',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444'
    });

    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`${API_BASE_URL}/admin/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Swal.fire('Deleted', 'Product removed successfully', 'success');
      fetchProducts();
    } catch (err) {
      Swal.fire('Error', 'Failed to delete product', 'error');
    }
  };

  const handleGenerateDescription = async (productId) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await automationAPI.generateDescription(productId, {});
      Swal.fire('Success', 'Product description generated', 'success');
      console.log('Generated description:', response.data.data);
    } catch (err) {
      Swal.fire('Error', err.response?.data?.error || 'Failed to generate description', 'error');
    }
  };

  const handleGenerateAds = async (productId) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await automationAPI.generateAds(productId, { count: 4 });
      Swal.fire('Success', 'Ad variations generated', 'success');
      console.log('Generated ads:', response.data.data);
    } catch (err) {
      Swal.fire('Error', err.response?.data?.error || 'Failed to generate ads', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'Wholesale',
      price: '',
      discount_percent: '',
      image_url: '',
      stock_quantity: '',
      rating: '5.0',
      is_featured: false,
      is_trending: false,
      is_flash_sale: false
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-900">Products</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FiPlus /> Add Product
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-4">
              {editingId ? 'Edit Product' : 'Add New Product'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold mb-2">Product Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold mb-2">Category *</label>
                <input
                  type="text"
                  list="category-options"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
                <datalist id="category-options">
                  {categoryNames.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-semibold mb-2">Price (GHS) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              {/* Discount */}
              <div>
                <label className="block text-sm font-semibold mb-2">Discount %</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.discount_percent}
                  onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Stock */}
              <div>
                <label className="block text-sm font-semibold mb-2">Stock Quantity</label>
                <input
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-semibold mb-2">Rating</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Description */}
            <div className="mt-4">
              <label className="block text-sm font-semibold mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Image Upload */}
            <div className="mt-4">
              <label className="block text-sm font-semibold mb-2">Product Image</label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full"
                  />
                  {uploadingImage && (
                    <p className="text-sm mt-2">{uploadingImage === 'uploading' ? '⏳ Uploading...' : '✅ Uploaded!'}</p>
                  )}
                </div>
                {formData.image_url && (
                  <PlaceholderImage
                    src={formData.image_url}
                    alt="Product"
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                )}
              </div>
            </div>

            {/* Checkboxes */}
            <div className="mt-4 space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                />
                <span>Featured Product</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_trending}
                  onChange={(e) => setFormData({ ...formData, is_trending: e.target.checked })}
                />
                <span>Trending</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_flash_sale}
                  onChange={(e) => setFormData({ ...formData, is_flash_sale: e.target.checked })}
                />
                <span>Flash Sale</span>
              </label>
            </div>

            {/* Buttons */}
            <div className="mt-6 flex gap-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                {editingId ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-6 text-center text-gray-600">Loading...</div>
          ) : products.length === 0 ? (
            <div className="p-6 text-center text-gray-600">No products found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Product</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Category</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Price</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Stock</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Features</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody classify="divide-y">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {product.image_url && (
                            <PlaceholderImage
                              src={product.image_url}
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded"
                            />
                          )}
                          <div>
                            <p className="font-semibold text-sm">{product.name}</p>
                            <p className="text-xs text-gray-500">{product.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">{product.category}</td>
                      <td className="px-6 py-4 text-sm font-semibold">
                        GHS {product.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={product.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                          {product.stock_quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs space-x-1">
                        {product.is_featured && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">Featured</span>}
                        {product.is_trending && <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">Trending</span>}
                        {product.is_flash_sale && <span className="bg-red-100 text-red-700 px-2 py-1 rounded">Flash</span>}
                      </td>
                      <td className="px-6 py-4 text-sm space-y-2">
                        <button
                          onClick={() => handleEdit(product.id)}
                          className="text-blue-600 hover:text-blue-700 mr-3"
                        >
                          <FiEdit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleGenerateDescription(product.id)}
                          className="text-green-600 hover:text-green-700 mr-3 text-xs font-semibold"
                        >
                          Generate Description
                        </button>
                        <button
                          onClick={() => handleGenerateAds(product.id)}
                          className="text-purple-600 hover:text-purple-700 text-xs font-semibold"
                        >
                          Generate Ads
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-700 block"
                        >
                          <FiTrash2 size={18} />
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
  );
};

export default AdminProducts;
