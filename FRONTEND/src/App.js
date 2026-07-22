/**
 * Main App Component
 * Sets up routing and global providers
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { CompareProvider } from './context/CompareContext';
import Header from './components/Header';
import Footer from './components/Footer';
import BrandFrame from './components/BrandFrame';
import AnnouncementBar from './components/AnnouncementBar';
import LocationSelector from './components/LocationSelector';
import { toast } from './components/ui/Toast';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminCategories from './pages/AdminCategories';
import AdminOrders from './pages/AdminOrders';
import AdminUsers from './pages/AdminUsers';
import AdminLocationsPage from './pages/AdminLocationsPage';
import AdminHeroBanner from './pages/AdminHeroBanner';
import AdminAdsPage from './pages/AdminAdsPage';
import TrendingProductsPage from './pages/TrendingProductsPage';
import NegotiationAssistantPage from './pages/NegotiationAssistantPage';
import ImportPage from './pages/ImportPage';
import CompetitorTrackingPage from './pages/CompetitorTrackingPage';
import WishlistPage from './pages/WishlistPage';
import ComparePage from './pages/ComparePage';
import VendorApplyPage from './pages/VendorApplyPage';
import VendorDashboard from './pages/VendorDashboard';
import StorePage from './pages/StorePage';
import AdminVendors from './pages/AdminVendors';
import AdminLayout from './components/AdminLayout';
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
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/compare" element={<ComparePage />} />
      <Route path="/store/:slug" element={<StorePage />} />

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
        path="/wishlist"
        element={
          <PrivateRoute>
            <WishlistPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/sell"
        element={
          <PrivateRoute>
            <VendorApplyPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/vendor/dashboard"
        element={
          <PrivateRoute>
            <VendorDashboard />
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

      {/* Admin Routes — nested under a single persistent AdminLayout (sidebar
          stays mounted across navigations instead of remounting per page) */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="products/new" element={<AdminProducts />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="locations" element={<AdminLocationsPage />} />
        <Route path="vendors" element={<AdminVendors />} />
        <Route path="hero-banner" element={<AdminHeroBanner />} />
        <Route path="competitor" element={<CompetitorTrackingPage />} />
        <Route path="ads" element={<AdminAdsPage />} />
        <Route path="trending" element={<TrendingProductsPage />} />
        <Route path="negotiation" element={<NegotiationAssistantPage />} />
        <Route path="import" element={<ImportPage />} />
      </Route>

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
  const [locationPromptOpen, setLocationPromptOpen] = useState(false);

  // Any page can hit the "no active delivery location" 403 (cart, checkout,
  // payment all gate on it) — catch it globally instead of only prompting
  // for a location right after login/register.
  useEffect(() => {
    const handleLocationRequired = () => setLocationPromptOpen(true);
    window.addEventListener('location-required', handleLocationRequired);
    return () => window.removeEventListener('location-required', handleLocationRequired);
  }, []);

  return (
    <div className="App">
      <BrandFrame />
      {!isAdminRoute && <AnnouncementBar />}
      {!isAdminRoute && <Header />}
      <main>
        <AppRoutes />
      </main>
      {!isAdminRoute && <Footer />}
      <BrandFrame />
      {locationPromptOpen && (
        <LocationSelector
          showModal
          onLocationSelect={() => {
            setLocationPromptOpen(false);
            toast.success('Delivery location set — try that again');
          }}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <HelmetProvider>
      <Router>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <CompareProvider>
                <Layout />
              </CompareProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </Router>
    </HelmetProvider>
  );
}

export default App;
