/**
 * Header Component
 * Main navigation header with logo, search, cart, and user icon
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiShoppingCart, FiUser, FiMenu, FiX } from 'react-icons/fi';
import { BsMicrophone } from 'react-icons/bs';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Header = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { itemCount } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchMode, setSearchMode] = useState('text'); // 'text', 'image', 'voice'

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
      setSearchTerm('');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // In a real app, you would upload image to backend for image search
      console.log('Image search:', file);
      // For now, just navigate to products
      navigate('/products');
    }
  };

  const handleVoiceSearch = async () => {
    // Check browser support for Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert('Voice search is not supported in your browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
      console.log('Voice search started...');
      setSearchMode('voice');
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      
      if (transcript.trim()) {
        navigate(`/products?search=${encodeURIComponent(transcript)}`);
      }
    };

    recognition.onerror = (event) => {
      console.error('Voice search error:', event.error);
      setSearchMode('text');
    };

    recognition.onend = () => {
      setSearchMode('text');
    };

    recognition.start();
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white shadow sticky top-0 z-50">
      {/* Top Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center text-xl font-bold text-blue-600">
            <span className="text-2xl mr-2">🙏</span>
            BlessedNet
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 mx-8">
            <div className="flex w-full items-center">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700 transition"
              >
                <FiSearch />
              </button>
              
              {/* Image Search */}
              <label className="ml-2 cursor-pointer text-gray-600 hover:text-blue-600 transition">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  title="Search by image"
                />
                <div className="text-xl p-2">🖼️</div>
              </label>

              {/* Voice Search */}
              <button
                type="button"
                onClick={handleVoiceSearch}
                className="ml-2 text-gray-600 hover:text-blue-600 transition text-xl p-2"
                title="Search by voice"
              >
                <BsMicrophone size={20} />
              </button>
            </div>
          </form>

          {/* Right Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Cart */}
            <Link to="/cart" className="relative text-gray-700 hover:text-blue-600 transition">
              <FiShoppingCart size={24} />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* User */}
            {isAuthenticated ? (
              <div className="relative group">
                <button className="text-gray-700 hover:text-blue-600 transition">
                  <FiUser size={24} />
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg hidden group-hover:block">
                  <div className="px-4 py-3 border-b">
                    <p className="font-semibold">{user?.username}</p>
                    <p className="text-sm text-gray-600">{user?.email}</p>
                  </div>
                  <Link to="/profile" className="block px-4 py-2 hover:bg-gray-100">
                    My Profile
                  </Link>
                  <Link to="/orders" className="block px-4 py-2 hover:bg-gray-100">
                    My Orders
                  </Link>
                  {user?.is_admin && (
                    <Link to="/admin" className="block px-4 py-2 hover:bg-gray-100 text-blue-600 font-semibold">
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-blue-600 transition">
                  Login
                </Link>
                <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-700"
          >
            {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* Mobile Search - Mobile */}
        <div className="md:hidden pb-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <button type="submit" className="bg-blue-600 text-white px-3 py-2 rounded-lg">
              <FiSearch />
            </button>
          </form>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-gray-50 border-t">
          <div className="px-4 py-3 space-y-3">
            <Link to="/cart" className="block text-gray-700 hover:text-blue-600">
              🛒 Cart ({itemCount})
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="block text-gray-700 hover:text-blue-600">
                  👤 Profile
                </Link>
                <Link to="/orders" className="block text-gray-700 hover:text-blue-600">
                  📦 My Orders
                </Link>
                {user?.is_admin && (
                  <Link to="/admin" className="block text-blue-600 font-semibold hover:text-blue-700">
                    ⚙️ Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="block w-full text-left text-red-600 hover:text-red-700"
                >
                  🚪 Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block text-gray-700 hover:text-blue-600">
                  Login
                </Link>
                <Link to="/register" className="block text-blue-600 font-semibold">
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
