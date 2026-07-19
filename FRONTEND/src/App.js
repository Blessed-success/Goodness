/**
 * Main App Component
 * Sets up routing and global providers
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminCategories from './pages/AdminCategories';
import AdminOrders from './pages/AdminOrders';
import AdminUsers from './pages/AdminUsers';
import AdminLocationsPage from './pages/AdminLocationsPage';
import AdminAdsPage from './pages/AdminAdsPage';
import TrendingProductsPage from './pages/TrendingProductsPage';
import NegotiationAssistantPage from './pages/NegotiationAssistantPage';
import ImportPage from './pages/ImportPage';
import CompetitorTrackingPage from './pages/CompetitorTrackingPage';
import './App.css';

// Protected Admin Route Component
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!user || !user.is_admin) {
    return <Navigate to="/login" />;
  }

  return children;
};

// Protected Route Component (any logged-in user)
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Customer Account Routes */}
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <ProfilePage />
          </PrivateRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <PrivateRoute>
            <OrdersPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/orders/:id"
        element={
          <PrivateRoute>
            <OrderDetailPage />
          </PrivateRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/products"
        element={
          <AdminRoute>
            <AdminProducts />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/products/new"
        element={
          <AdminRoute>
            <AdminProducts />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/categories"
        element={
          <AdminRoute>
            <AdminCategories />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <AdminRoute>
            <AdminOrders />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <AdminUsers />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/locations"
        element={
          <AdminRoute>
            <AdminLocationsPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/competitor"
        element={
          <AdminRoute>
            <CompetitorTrackingPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/ads"
        element={
          <AdminRoute>
            <AdminAdsPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/trending"
        element={
          <AdminRoute>
            <TrendingProductsPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/negotiation"
        element={
          <AdminRoute>
            <NegotiationAssistantPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/import"
        element={
          <AdminRoute>
            <ImportPage />
          </AdminRoute>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

// AdminLayout renders its own header/sidebar, so the storefront Header
// is only shown outside of /admin/* routes.
function Layout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="App">
      {!isAdminRoute && <Header />}
      <main>
        <AppRoutes />
      </main>
      {!isAdminRoute && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Layout />
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
