/**
 * API Configuration and Client
 * Centralized API calls for all backend endpoints
 */

// Production API URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.ever-flourishing.com/api';

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
      // Token expired or invalid
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
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
};

// Product API calls
export const productsAPI = {
  getAll: (params) => apiClient.get('/products', { params }),
  getById: (id) => apiClient.get(`/products/${id}`),
  getCategories: () => apiClient.get('/products/categories'),
  create: (data) => apiClient.post('/products', data),
  update: (id, data) => apiClient.put(`/products/${id}`, data),
  delete: (id) => apiClient.delete(`/products/${id}`),
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
