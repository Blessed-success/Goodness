/**
 * Admin Categories Management
 * Add, edit, and delete product categories, including their display image
 */

import React, { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';
import PlaceholderImage from '../components/ui/PlaceholderImage';
import { adminCategoriesAPI, uploadAPI } from '../api';
import Swal from 'sweetalert2';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(null);
  const [formData, setFormData] = useState({ name: '', image_url: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await adminCategoriesAPI.getAll();
      setCategories(response.data.data);
    } catch (err) {
      Swal.fire('Error', 'Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingImage('uploading');
      const response = await uploadAPI.uploadImage(file, 'categories');
      setFormData((prev) => ({ ...prev, image_url: response.data.data.url }));
      setUploadingImage('success');
      setTimeout(() => setUploadingImage(null), 2000);
    } catch (err) {
      Swal.fire('Error', 'Failed to upload image', 'error');
      setUploadingImage(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      Swal.fire('Error', 'Category name is required', 'error');
      return;
    }

    try {
      if (editingId) {
        await adminCategoriesAPI.update(editingId, formData);
        Swal.fire('Success', 'Category updated successfully', 'success');
      } else {
        await adminCategoriesAPI.create(formData);
        Swal.fire('Success', 'Category created successfully', 'success');
      }

      resetForm();
      fetchCategories();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.error || 'Failed to save category', 'error');
    }
  };

  const handleEdit = (category) => {
    setFormData({ name: category.name, image_url: category.image_url || '' });
    setEditingId(category.id);
    setShowForm(true);
  };

  const handleDelete = async (category) => {
    const result = await Swal.fire({
      title: 'Delete Category?',
      text: `"${category.name}" will be removed. Products already tagged with this category keep their name, they just lose the display image.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444'
    });

    if (!result.isConfirmed) return;

    try {
      await adminCategoriesAPI.delete(category.id);
      Swal.fire('Deleted', 'Category removed successfully', 'success');
      fetchCategories();
    } catch (err) {
      Swal.fire('Error', 'Failed to delete category', 'error');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', image_url: '' });
    setEditingId(null);
    setShowForm(false);
  };

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-900">Categories</h2>
          <button
            onClick={() => (showForm ? resetForm() : setShowForm(true))}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FiPlus /> Add Category
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-4">
              {editingId ? 'Edit Category' : 'Add New Category'}
            </h3>

            <div>
              <label className="block text-sm font-semibold mb-2">Category Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="e.g. Electronics"
                required
              />
            </div>

            {/* Image Upload */}
            <div className="mt-4">
              <label className="block text-sm font-semibold mb-2">Category Image</label>
              <div className="flex gap-4 items-center">
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
                    alt="Category"
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                )}
              </div>
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

        {/* Categories Grid */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-6 text-center text-gray-600">Loading...</div>
          ) : categories.length === 0 ? (
            <div className="p-6 text-center text-gray-600">
              No categories yet. Categories used by products still show up on the storefront
              without an image — add one here to give them a picture.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
              {categories.map((category) => (
                <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="aspect-square bg-gray-100">
                    <PlaceholderImage
                      src={category.image_url}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-sm truncate">{category.name}</p>
                    <div className="mt-2 flex gap-3">
                      <button
                        onClick={() => handleEdit(category)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
  );
};

export default AdminCategories;
