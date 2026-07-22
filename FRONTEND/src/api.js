/**
 * API Configuration and Client
 * Centralized API calls for all backend endpoints
 */
import axios from 'axios';

// Falls back to the current host on port 5000 so the same build works
// both locally and in production without a hardcoded URL.
const API_BASE_URL = process.env.REACT_APP_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:5000/api`;

// Backend origin without the trailing /api, used to resolve uploaded image
// paths (e.g. "/uploads/products/xyz.jpg") into absolute URLs.
const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

/**
 * Resolve an image path returned by the backend (relative upload path or
 * absolute URL) into a URL the browser can load.
 */
export const resolveImageUrl = (url) => {
  if (!url) return url;
  if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:')) return url;
  return `${BACKEND_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
};

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth-logout'));
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    // Any endpoint can 403 with this shape when the account has no active
    // delivery location set (cart/orders/payment all gate on it) — surface a
    // way to fix it from wherever the user happens to be, since the location
    // prompt otherwise only appears right after login/register.
    if (error.response?.status === 403 && error.response?.data?.error === 'Service not available in your location') {
      window.dispatchEvent(new Event('location-required'));
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  getProfile: () => apiClient.get('/auth/profile'),
  updateProfile: (data) => apiClient.put('/auth/profile', data),
  changePassword: (data) => apiClient.post('/auth/change-password', data),
  forgotPassword: (data) => apiClient.post('/auth/forgot-password', data),
  resetPassword: (data) => apiClient.post('/auth/reset-password', data),
};

// Product API calls
export const productsAPI = {
  getAll: (params) => apiClient.get('/products', { params }),
  getById: (id) => apiClient.get(`/products/${id}`),
  getCategories: () => apiClient.get('/products/categories'),
  getPriceRange: () => apiClient.get('/products/price-range'),
  searchByImage: (file) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post('/products/search-by-image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  create: (data) => apiClient.post('/products', data),
  update: (id, data) => apiClient.put(`/products/${id}`, data),
  delete: (id) => apiClient.delete(`/products/${id}`),
};

// Public category API calls (list, with images)
export const categoriesAPI = {
  getAll: () => apiClient.get('/categories'),
};

// Admin category management (create/update/delete + image upload)
export const adminCategoriesAPI = {
  getAll: () => apiClient.get('/admin/categories'),
  create: (data) => apiClient.post('/admin/categories', data),
  update: (id, data) => apiClient.put(`/admin/categories/${id}`, data),
  delete: (id) => apiClient.delete(`/admin/categories/${id}`),
};

// Public hero banner (homepage hero section)
export const heroBannerAPI = {
  getActive: () => apiClient.get('/hero-banner'),
};

// Admin hero banner management (create/update/delete)
export const adminHeroBannerAPI = {
  getAll: () => apiClient.get('/admin/hero-banners'),
  create: (data) => apiClient.post('/admin/hero-banners', data),
  update: (id, data) => apiClient.put(`/admin/hero-banners/${id}`, data),
  delete: (id) => apiClient.delete(`/admin/hero-banners/${id}`),
};

// Vendor (marketplace seller) API calls
export const vendorAPI = {
  getBySlug: (slug) => apiClient.get(`/vendors/${slug}`),
  apply: (data) => apiClient.post('/vendors/apply', data),
  getMe: () => apiClient.get('/vendors/me'),
  updateMe: (data) => apiClient.put('/vendors/me', data),
  getMyProducts: () => apiClient.get('/vendors/me/products'),
  getMyOrders: () => apiClient.get('/vendors/me/orders'),
  getMyEarnings: () => apiClient.get('/vendors/me/earnings'),
};

// Admin vendor management (approve/reject/commission, earnings ledger)
export const adminVendorAPI = {
  getAll: () => apiClient.get('/admin/vendors'),
  update: (id, data) => apiClient.put(`/admin/vendors/${id}`, data),
  getEarnings: () => apiClient.get('/admin/vendor-earnings'),
  markEarningPaid: (id) => apiClient.put(`/admin/vendor-earnings/${id}/mark-paid`),
};

// Admin image upload (shared by products and categories via the 'type' field)
export const uploadAPI = {
  uploadImage: (file, type = 'products') => {
    const form = new FormData();
    form.append('file', file);
    form.append('type', type);
    return apiClient.post('/admin/upload-image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Admin AI and automation APIs
export const automationAPI = {
  generateDescription: (productId, data) => apiClient.post(`/admin/products/${productId}/generate-description`, data),
  generateAds: (productId, data) => apiClient.post(`/admin/products/${productId}/generate-ads`, data),
  getTrendingProducts: (params) => apiClient.get('/admin/trending-products', { params }),
  generateNegotiationMessage: (data) => apiClient.post('/admin/generate-negotiation-message', data),
  forwardOrderToSupplier: (orderId, data) => apiClient.post(`/admin/orders/${orderId}/forward-supplier`, data),
};

// Cart API calls
export const cartAPI = {
  getCart: () => apiClient.get('/cart'),
  addItem: (data) => apiClient.post('/cart/add', data),
  updateItem: (itemId, data) => apiClient.put(`/cart/item/${itemId}`, data),
  removeItem: (itemId) => apiClient.delete(`/cart/item/${itemId}`),
  clearCart: () => apiClient.delete('/cart/clear'),
};

// Wishlist API calls
export const wishlistAPI = {
  getAll: () => apiClient.get('/wishlist'),
  add: (productId) => apiClient.post('/wishlist', { product_id: productId }),
  remove: (productId) => apiClient.delete(`/wishlist/${productId}`),
};

// Product review API calls
export const reviewsAPI = {
  getForProduct: (productId, params) => apiClient.get(`/reviews/product/${productId}`, { params }),
  submit: (data) => apiClient.post('/reviews', data),
  delete: (id) => apiClient.delete(`/reviews/${id}`),
};

// In-app notification API calls
export const notificationsAPI = {
  getAll: (params) => apiClient.get('/notifications', { params }),
  markRead: (id) => apiClient.put(`/notifications/${id}/read`),
  markAllRead: () => apiClient.put('/notifications/read-all'),
};

// Order API calls
export const ordersAPI = {
  getMyOrders: (params) => apiClient.get('/orders', { params }),
  getOrder: (id) => apiClient.get(`/orders/${id}`),
  create: (data) => apiClient.post('/orders', data),
  cancel: (id) => apiClient.post(`/orders/${id}/cancel`),
  getAllOrders: (params) => apiClient.get('/orders/admin/all', { params }),
  updateStatus: (id, data) => apiClient.put(`/orders/admin/${id}/status`, data),
};

// Payment API calls
export const paymentAPI = {
  initialize: (data) => apiClient.post('/payment/initialize', data),
  verify: (data) => apiClient.post('/payment/verify', data),
  verifyPayment: (data) => apiClient.post('/verify-payment', data),
  whatsappOrder: (data) => apiClient.post('/payment/whatsapp-order', data),
};

// Product Import API calls
export const importAPI = {
  preview: (data) => apiClient.post('/import/preview', data),
  singleProduct: (data) => apiClient.post('/import/product', data),
  batchImport: (data) => apiClient.post('/import/batch', data),
  getExchangeRate: () => apiClient.get('/import/exchange-rate'),
  profitCalculator: (data) => apiClient.post('/import/profit-calculator', data),
};

export default apiClient;
