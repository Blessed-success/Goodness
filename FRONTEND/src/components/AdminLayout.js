/**
 * Admin Layout Component
 * Sidebar navigation and main layout for admin dashboard
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FiTarget, FiMenu, FiX, FiLogOut, FiHome, FiBox, FiShoppingCart, FiUsers,
  FiUpload, FiMapPin, FiFileText, FiTrendingUp, FiMessageSquare, FiShoppingBag, FiGrid,
} from 'react-icons/fi';
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

  const coreItems = [
    { path: '/admin', label: 'Dashboard', icon: FiHome },
    { path: '/admin/products', label: 'Products', icon: FiBox },
    { path: '/admin/categories', label: 'Categories', icon: FiGrid },
    { path: '/admin/orders', label: 'Orders', icon: FiShoppingCart },
    { path: '/admin/users', label: 'Users', icon: FiUsers },
    { path: '/admin/locations', label: 'Locations', icon: FiMapPin },
  ];

  const automationItems = [
    { path: '/admin/ads', label: 'Ad Generator', icon: FiFileText },
    { path: '/admin/trending', label: 'Trending Today', icon: FiTrendingUp },
    { path: '/admin/negotiation', label: 'Negotiation Assistant', icon: FiMessageSquare },
    { path: '/admin/competitor', label: 'Competitor Tracking', icon: FiTarget },
    { path: '/admin/import', label: 'Product Import', icon: FiUpload },
  ];

  const renderLink = (item) => {
    const Icon = item.icon;
    return (
      <Link
        key={item.path}
        to={item.path}
        className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition-colors ${
          isActive(item.path) ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
        }`}
      >
        <Icon size={18} />
        {sidebarOpen && <span>{item.label}</span>}
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} flex flex-col bg-gray-900 text-white transition-all duration-300`}>
        <div className="flex items-center justify-between p-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white">
              <FiShoppingBag size={16} />
            </span>
            {sidebarOpen && <span className="text-lg font-bold">BlessedNet</span>}
          </Link>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-white">
            {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-4">
          <div className="space-y-1">
            {sidebarOpen && (
              <p className="px-4 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Store</p>
            )}
            {coreItems.map(renderLink)}
          </div>
          <div className="space-y-1">
            {sidebarOpen && (
              <p className="px-4 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Automation Tools</p>
            )}
            {automationItems.map(renderLink)}
          </div>
        </nav>

        <div className="border-t border-gray-800 p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 font-bold text-white">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{user?.username}</p>
                <p className="text-xs text-gray-400">Admin</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold transition-colors hover:bg-red-700"
          >
            <FiLogOut size={16} />
            {sidebarOpen && 'Logout'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
          <Link to="/" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
            &larr; Back to Store
          </Link>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
