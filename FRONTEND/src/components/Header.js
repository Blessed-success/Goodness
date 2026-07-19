/**
 * Header Component
 * Main navigation header with logo, search, cart, and user menu
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiShoppingCart, FiUser, FiMenu, FiX, FiPackage, FiLogOut, FiShoppingBag } from 'react-icons/fi';
import { BsMic } from 'react-icons/bs';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { toast } from './ui/Toast';

const Header = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { itemCount } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [listening, setListening] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
      setSearchTerm('');
    }
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error('Voice search is not supported in your browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join('');

      if (transcript.trim()) {
        navigate(`/products?search=${encodeURIComponent(transcript)}`);
      }
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognition.start();
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex flex-shrink-0 items-center gap-2 text-xl font-bold text-gray-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white">
              <FiShoppingBag size={16} />
            </span>
            BlessedNet
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="mx-4 hidden max-w-xl flex-1 md:flex">
            <div className="flex w-full items-center rounded-full border border-gray-200 bg-gray-50 pl-4 pr-1.5 focus-within:border-primary-400 focus-within:bg-white transition-colors">
              <FiSearch className="text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent px-3 py-2 text-sm focus:outline-none"
              />
              <button
                type="button"
                onClick={handleVoiceSearch}
                className={`rounded-full p-2 transition-colors ${
                  listening ? 'text-primary-600' : 'text-gray-400 hover:text-primary-600'
                }`}
                title="Search by voice"
              >
                <BsMic size={16} />
              </button>
            </div>
          </form>

          {/* Right Navigation */}
          <div className="hidden items-center gap-5 md:flex">
            <Link to="/cart" className="relative text-gray-600 hover:text-primary-600 transition-colors">
              <FiShoppingCart size={22} />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-xs font-semibold text-white">
                  {itemCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="group relative">
                <button className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                  <FiUser size={18} />
                </button>
                <div className="invisible absolute right-0 mt-2 w-52 rounded-xl border border-gray-100 bg-white py-1 opacity-0 shadow-card-hover transition-all group-hover:visible group-hover:opacity-100">
                  <div className="border-b border-gray-100 px-4 py-3">
                    <p className="truncate font-semibold text-gray-900">{user?.username}</p>
                    <p className="truncate text-sm text-gray-500">{user?.email}</p>
                  </div>
                  <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <FiUser size={15} /> My Profile
                  </Link>
                  <Link to="/orders" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <FiPackage size={15} /> My Orders
                  </Link>
                  {user?.is_admin && (
                    <Link to="/admin" className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary-600 hover:bg-gray-50">
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                  >
                    <FiLogOut size={15} /> Logout
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-gray-600 md:hidden"
          >
            {mobileMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>

        {/* Mobile Search */}
        <div className="pb-3 md:hidden">
          <form onSubmit={handleSearch} className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5">
            <FiSearch className="text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent py-1 text-sm focus:outline-none"
            />
          </form>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-gray-100 bg-white md:hidden">
          <div className="space-y-1 px-4 py-3">
            <Link to="/cart" className="flex items-center gap-2 py-2 text-sm text-gray-700">
              <FiShoppingCart size={16} /> Cart ({itemCount})
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="flex items-center gap-2 py-2 text-sm text-gray-700">
                  <FiUser size={16} /> My Profile
                </Link>
                <Link to="/orders" className="flex items-center gap-2 py-2 text-sm text-gray-700">
                  <FiPackage size={16} /> My Orders
                </Link>
                {user?.is_admin && (
                  <Link to="/admin" className="flex items-center gap-2 py-2 text-sm font-semibold text-primary-600">
                    Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 py-2 text-left text-sm text-red-600"
                >
                  <FiLogOut size={16} /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block py-2 text-sm text-gray-700">
                  Login
                </Link>
                <Link to="/register" className="block py-2 text-sm font-semibold text-primary-600">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
