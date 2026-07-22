/**
 * Admin Hero Banner Management
 * Fully editable homepage hero: video, text, offers, countdown timer,
 * colors, and scheduling. Mirrors the AdminCategories CRUD pattern.
 */

import React, { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiPlus, FiVideo } from 'react-icons/fi';
import PlaceholderImage from '../components/ui/PlaceholderImage';
import { adminHeroBannerAPI, uploadAPI } from '../api';
import Swal from 'sweetalert2';

const EMPTY_FORM = {
  headline: '',
  subheading: '',
  badge_text: '',
  video_url: '',
  poster_image_url: '',
  cta_shop_text: 'Shop Now',
  cta_shop_link: '/products',
  cta_deals_text: 'View Deals',
  cta_deals_link: '/products?flash_sale=true',
  show_watch_video: true,
  flash_sale_label: '',
  announcement_text: '',
  announcement_link: '',
  ticker_text: '',
  countdown_enabled: false,
  countdown_end: '',
  countdown_label: 'Flash Sale Ends In',
  overlay_color: '#123d2a',
  accent_color: '#82d06e',
  is_active: true,
  starts_at: '',
  ends_at: '',
  display_order: 0,
};

/** Trim an ISO datetime string down to the "YYYY-MM-DDTHH:MM" a <input type="datetime-local"> expects */
const toDatetimeLocal = (iso) => (iso ? iso.slice(0, 16) : '');

const AdminHeroBanner = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(null);
  const [uploadingVideo, setUploadingVideo] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await adminHeroBannerAPI.getAll();
      setBanners(response.data.data);
    } catch (err) {
      Swal.fire('Error', 'Failed to load hero banners', 'error');
    } finally {
      setLoading(false);
    }
  };

  const setField = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingImage('uploading');
      const response = await uploadAPI.uploadImage(file, 'banners');
      setField('poster_image_url', response.data.data.url);
      setUploadingImage('success');
      setTimeout(() => setUploadingImage(null), 2000);
    } catch (err) {
      Swal.fire('Error', 'Failed to upload poster image', 'error');
      setUploadingImage(null);
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingVideo('uploading');
      const response = await uploadAPI.uploadImage(file, 'banner_videos');
      setField('video_url', response.data.data.url);
      setUploadingVideo('success');
      setTimeout(() => setUploadingVideo(null), 2000);
    } catch (err) {
      Swal.fire('Error', err.response?.data?.error || 'Failed to upload video', 'error');
      setUploadingVideo(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      countdown_end: formData.countdown_enabled && formData.countdown_end ? formData.countdown_end : null,
      starts_at: formData.starts_at || null,
      ends_at: formData.ends_at || null,
      display_order: Number(formData.display_order) || 0,
    };

    try {
      if (editingId) {
        await adminHeroBannerAPI.update(editingId, payload);
        Swal.fire('Success', 'Hero banner updated successfully', 'success');
      } else {
        await adminHeroBannerAPI.create(payload);
        Swal.fire('Success', 'Hero banner created successfully', 'success');
      }

      resetForm();
      fetchBanners();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.error || 'Failed to save hero banner', 'error');
    }
  };

  const handleEdit = (banner) => {
    setFormData({
      ...EMPTY_FORM,
      ...banner,
      countdown_end: toDatetimeLocal(banner.countdown_end),
      starts_at: toDatetimeLocal(banner.starts_at),
      ends_at: toDatetimeLocal(banner.ends_at),
    });
    setEditingId(banner.id);
    setShowForm(true);
  };

  const handleDelete = async (banner) => {
    const result = await Swal.fire({
      title: 'Delete Hero Banner?',
      text: `"${banner.headline || 'Untitled banner'}" will be removed permanently.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
    });

    if (!result.isConfirmed) return;

    try {
      await adminHeroBannerAPI.delete(banner.id);
      Swal.fire('Deleted', 'Hero banner removed successfully', 'success');
      fetchBanners();
    } catch (err) {
      Swal.fire('Error', 'Failed to delete hero banner', 'error');
    }
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-900">Hero Banner</h2>
          <button
            onClick={() => (showForm ? resetForm() : setShowForm(true))}
            className="bg-primary-700 text-white px-4 py-2 rounded-lg hover:bg-primary-800 flex items-center gap-2"
          >
            <FiPlus /> Add Hero Banner
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
            <h3 className="text-xl font-bold">{editingId ? 'Edit Hero Banner' : 'Add New Hero Banner'}</h3>

            {/* Content */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wide text-gray-500">Content</h4>
              <div>
                <label className="block text-sm font-semibold mb-2">Badge Text</label>
                <input
                  type="text"
                  value={formData.badge_text}
                  onChange={(e) => setField('badge_text', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                  placeholder="e.g. Wholesale Marketplace · Ghana"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Headline</label>
                <textarea
                  value={formData.headline}
                  onChange={(e) => setField('headline', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                  placeholder="Wholesale, sourced right and delivered fast"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Subheading</label>
                <textarea
                  value={formData.subheading}
                  onChange={(e) => setField('subheading', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

            {/* Media */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wide text-gray-500">Media</h4>
              <div>
                <label className="block text-sm font-semibold mb-2">Poster Image</label>
                <div className="flex gap-4 items-center">
                  <div className="flex-1">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full" />
                    {uploadingImage && (
                      <p className="text-sm mt-2">{uploadingImage === 'uploading' ? '⏳ Uploading...' : '✅ Uploaded!'}</p>
                    )}
                  </div>
                  {formData.poster_image_url && (
                    <PlaceholderImage src={formData.poster_image_url} alt="Poster" className="w-24 h-16 object-cover rounded-lg" />
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Promo Video</label>
                <p className="text-xs text-gray-500 mb-2">MP4/WebM/MOV, up to 40MB. Autoplays muted &amp; looped on the homepage.</p>
                <div className="flex gap-4 items-center">
                  <div className="flex-1">
                    <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={handleVideoUpload} className="w-full" />
                    {uploadingVideo && (
                      <p className="text-sm mt-2">{uploadingVideo === 'uploading' ? '⏳ Uploading...' : '✅ Uploaded!'}</p>
                    )}
                  </div>
                  {formData.video_url && (
                    <span className="flex items-center gap-1.5 text-sm text-primary-700"><FiVideo size={16} /> Video set</span>
                  )}
                </div>
              </div>
            </div>

            {/* Calls to action */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wide text-gray-500">Calls to Action</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Shop Button Text</label>
                  <input type="text" value={formData.cta_shop_text} onChange={(e) => setField('cta_shop_text', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Shop Button Link</label>
                  <input type="text" value={formData.cta_shop_link} onChange={(e) => setField('cta_shop_link', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Deals Button Text</label>
                  <input type="text" value={formData.cta_deals_text} onChange={(e) => setField('cta_deals_text', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Deals Button Link</label>
                  <input type="text" value={formData.cta_deals_link} onChange={(e) => setField('cta_deals_link', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={formData.show_watch_video} onChange={(e) => setField('show_watch_video', e.target.checked)} />
                Show "Watch Video" button (only appears once a video is uploaded)
              </label>
            </div>

            {/* Promotions */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wide text-gray-500">Promotions</h4>
              <div>
                <label className="block text-sm font-semibold mb-2">Flash Sale Ribbon Text</label>
                <input type="text" value={formData.flash_sale_label} onChange={(e) => setField('flash_sale_label', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g. FLASH SALE (leave blank to hide)" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Announcement Bar Text</label>
                  <input type="text" value={formData.announcement_text} onChange={(e) => setField('announcement_text', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g. Free delivery on orders over GHS 500 this week!" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Announcement Link (optional)</label>
                  <input type="text" value={formData.announcement_link} onChange={(e) => setField('announcement_link', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Scrolling Offer Ticker</label>
                <p className="text-xs text-gray-500 mb-2">One offer per line — scrolls across the bottom of the hero.</p>
                <textarea
                  value={(formData.ticker_text || '').split('|').join('\n')}
                  onChange={(e) => setField('ticker_text', e.target.value.split('\n').map((l) => l.trim()).filter(Boolean).join('|'))}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder={'Free delivery over GHS 500\n20% off electronics this week\nNew arrivals every Friday'}
                />
              </div>
            </div>

            {/* Countdown */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wide text-gray-500">Countdown Timer</h4>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={formData.countdown_enabled} onChange={(e) => setField('countdown_enabled', e.target.checked)} />
                Show countdown timer in hero
              </label>
              {formData.countdown_enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Countdown Label</label>
                    <input type="text" value={formData.countdown_label} onChange={(e) => setField('countdown_label', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Ends At</label>
                    <input type="datetime-local" value={formData.countdown_end} onChange={(e) => setField('countdown_end', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                  </div>
                </div>
              )}
            </div>

            {/* Colors */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wide text-gray-500">Colors</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Overlay Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={formData.overlay_color} onChange={(e) => setField('overlay_color', e.target.value)} className="h-10 w-14 rounded border border-gray-300" />
                    <input type="text" value={formData.overlay_color} onChange={(e) => setField('overlay_color', e.target.value)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Accent Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={formData.accent_color} onChange={(e) => setField('accent_color', e.target.value)} className="h-10 w-14 rounded border border-gray-300" />
                    <input type="text" value={formData.accent_color} onChange={(e) => setField('accent_color', e.target.value)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg" />
                  </div>
                </div>
              </div>
            </div>

            {/* Scheduling */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wide text-gray-500">Scheduling</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Starts At (optional)</label>
                  <input type="datetime-local" value={formData.starts_at} onChange={(e) => setField('starts_at', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Ends At (optional)</label>
                  <input type="datetime-local" value={formData.ends_at} onChange={(e) => setField('ends_at', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Display Order</label>
                  <input type="number" value={formData.display_order} onChange={(e) => setField('display_order', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
                <label className="flex items-center gap-2 text-sm font-semibold self-end pb-2">
                  <input type="checkbox" checked={formData.is_active} onChange={(e) => setField('is_active', e.target.checked)} />
                  Active
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" className="bg-primary-700 text-white px-6 py-2 rounded-lg hover:bg-primary-800">
                {editingId ? 'Update' : 'Create'}
              </button>
              <button type="button" onClick={resetForm} className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400">
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-6 text-center text-gray-600">Loading...</div>
          ) : banners.length === 0 ? (
            <div className="p-6 text-center text-gray-600">
              No hero banners yet. The homepage shows its default hero copy until you add one.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {banners.map((banner) => (
                <div key={banner.id} className="p-4 flex items-center gap-4">
                  <div className="w-20 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <PlaceholderImage src={banner.poster_image_url} alt={banner.headline || 'Hero banner'} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{banner.headline || 'Untitled banner'}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {banner.is_active ? 'Active' : 'Inactive'}
                      {banner.starts_at && ` · from ${new Date(banner.starts_at).toLocaleString()}`}
                      {banner.ends_at && ` · until ${new Date(banner.ends_at).toLocaleString()}`}
                    </p>
                  </div>
                  <div className="flex gap-3 flex-shrink-0">
                    <button onClick={() => handleEdit(banner)} className="text-primary-700 hover:text-primary-800">
                      <FiEdit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(banner)} className="text-red-600 hover:text-red-700">
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
  );
};

export default AdminHeroBanner;
