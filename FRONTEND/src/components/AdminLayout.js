/**
 * Admin Layout Component
 * Sidebar navigation and main layout for admin dashboard
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiMenu, FiX, FiLogOut, FiHome, FiBox, FiShoppingCart, FiUsers, FiBarChart3, FiUpload, FiMapPin, FiFileText, FiTrendingUp, FiMessageSquare } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname.startsWith(path);

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: FiHome },
    { path: '/admin/products', label: 'Products', icon: FiBox },
    { path: '/admin/orders', label: 'Orders', icon: FiShoppingCart },
    { path: '/admin/users', label: 'Users', icon: FiUsers },
    { path: '/admin/ads', label: 'Ad Generator', icon: FiFileText },
    { path: '/admin/trending', label: 'Trending Today', icon: FiTrendingUp },
    { path: '/admin/negotiation', label: 'Negotiation Assistant', icon: FiMessageSquare },
    { path: '/admin/locations', label: 'Locations', icon: FiMapPin },
    { path: '/admin/competitor', label: 'Competitor Tracking', icon: FiTarget },
    { path: '/admin/import', label: 'Product Import', icon: FiUpload },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gray-900 text-white transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🙏</span>
            {sidebarOpen && <span className="font-bold text-lg">BlessedNet</span>}
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-white"
          >
            {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-2 py-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive(item.path)
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800'
                }`}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-700 p-4">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold"
            >
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user?.username}</p>
                <p className="text-xs text-gray-400">Admin</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition text-sm font-semibold"
          >
            <FiLogOut size={16} />
            {sidebarOpen && 'Logout'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
            >
              ← Back to Store
            </Link>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
