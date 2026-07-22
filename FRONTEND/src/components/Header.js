/**
 * Header Component
 * Main navigation header with logo, search, cart, and user menu
 */

import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiShoppingCart, FiUser, FiMenu, FiX, FiPackage, FiLogOut, FiShoppingBag, FiHeart, FiRepeat, FiCamera } from 'react-icons/fi';
import { BsMic } from 'react-icons/bs';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useCompare } from '../context/CompareContext';
import { useWishlist } from '../context/WishlistContext';
import { toast } from './ui/Toast';
import NotificationBell from './NotificationBell';
import { productsAPI } from '../api';
import logo from '../assets/nexus-logo.png';

const Header = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { itemCount } = useCart();
  const { itemCount: compareCount } = useCompare();
  const { itemCount: wishlistCount } = useWishlist();
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [imageSearching, setImageSearching] = useState(false);
  const imageInputRef = useRef(null);

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

  const handleImageSearch = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;

    try {
      setImageSearching(true);
      const response = await productsAPI.searchByImage(file);
      navigate('/products', { state: { visualResults: response.data.data.products } });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Image search failed');
    } finally {
      setImageSearching(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-20 items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex flex-shrink-0 items-center">
            <img src={logo} alt="Nexus" className="h-11 w-auto" />
          </Link>

          {/* Search Bar - Desktop (height increased only; length/width unchanged) */}
          <form onSubmit={handleSearch} className="mx-4 hidden max-w-xl flex-1 md:flex">
            <div className="flex h-12 w-full items-center rounded-full border border-gray-200 bg-gray-50 pl-4 pr-1.5 focus-within:border-primary-400 focus-within:bg-white transition-colors">
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
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={imageSearching}
                className="rounded-full p-2 text-gray-400 transition-colors hover:text-primary-600 disabled:opacity-50"
                title="Search by photo"
              >
                <FiCamera size={16} />
              </button>
            </div>
          </form>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSearch}
            className="hidden"
          />

          {/* Right Navigation */}
          <div className="hidden items-center gap-5 md:flex">
            <NotificationBell />

            {!user?.is_admin && compareCount > 0 && (
              <Link
                to="/compare"
                className="relative flex h-11 w-11 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100"
                title="Compare"
              >
                <FiRepeat size={20} />
                <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-semibold text-white">
                  {compareCount}
                </span>
              </Link>
            )}

            {isAuthenticated && !user?.is_admin && (
              <Link
                to="/wishlist"
                className="relative flex h-11 w-11 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100"
                title="Wishlist"
              >
                <FiHeart size={20} />
                {wishlistCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-semibold text-white">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            )}

            {!user?.is_admin && (
              <Link
                to="/cart"
                className="relative flex h-11 w-11 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100"
              >
                <FiShoppingCart size={20} />
                {itemCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-semibold text-white">
                    {itemCount}
                  </span>
                )}
              </Link>
            )}

            {isAuthenticated ? (
              <div className="group relative">
                <button className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                  <FiUser size={20} />
                </button>
                <div className="invisible absolute right-0 mt-2 w-52 rounded-xl border border-gray-100 bg-white py-1 opacity-0 shadow-card-hover transition-all group-hover:visible group-hover:opacity-100">
                  <div className="border-b border-gray-100 px-4 py-3">
                    <p className="truncate font-semibold text-gray-900">{user?.username}</p>
                    <p className="truncate text-sm text-gray-500">{user?.email}</p>
                  </div>
                  {user?.is_admin ? (
                    <Link to="/admin" className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary-600 hover:bg-gray-50">
                      <FiUser size={15} /> Admin Dashboard
                    </Link>
                  ) : (
                    <>
                      <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <FiUser size={15} /> My Profile
                      </Link>
                      <Link to="/orders" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <FiPackage size={15} /> My Orders
                      </Link>
                      <Link to={user?.is_vendor ? '/vendor/dashboard' : '/sell'} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <FiShoppingBag size={15} /> {user?.is_vendor ? 'My Store' : 'Sell on Nexus'}
                      </Link>
                    </>
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
                  className="rounded-full bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-11 w-11 items-center justify-center text-gray-600 md:hidden"
          >
            {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* Mobile Search */}
        <div className="pb-3 md:hidden">
          <form onSubmit={handleSearch} className="flex h-11 items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3">
            <FiSearch className="text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent py-1 text-sm focus:outline-none"
            />
            <button
              type="button"
              onClick={handleVoiceSearch}
              className={`rounded-full p-1.5 ${listening ? 'text-primary-600' : 'text-gray-400'}`}
              title="Search by voice"
            >
              <BsMic size={15} />
            </button>
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={imageSearching}
              className="rounded-full p-1.5 text-gray-400 disabled:opacity-50"
              title="Search by photo"
            >
              <FiCamera size={15} />
            </button>
          </form>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-gray-100 bg-white md:hidden">
          <div className="space-y-1 px-4 py-3">
            {!user?.is_admin && (
              <Link to="/cart" className="flex items-center gap-2 py-2 text-sm text-gray-700">
                <FiShoppingCart size={16} /> Cart ({itemCount})
              </Link>
            )}
            {isAuthenticated ? (
              <>
                {user?.is_admin ? (
                  <Link to="/admin" className="flex items-center gap-2 py-2 text-sm font-semibold text-primary-600">
                    <FiUser size={16} /> Admin Dashboard
                  </Link>
                ) : (
                  <>
                    <Link to="/profile" className="flex items-center gap-2 py-2 text-sm text-gray-700">
                      <FiUser size={16} /> My Profile
                    </Link>
                    <Link to="/orders" className="flex items-center gap-2 py-2 text-sm text-gray-700">
                      <FiPackage size={16} /> My Orders
                    </Link>
                    <Link to="/wishlist" className="flex items-center gap-2 py-2 text-sm text-gray-700">
                      <FiHeart size={16} /> Wishlist
                    </Link>
                  </>
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
