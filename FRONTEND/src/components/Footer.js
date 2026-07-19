/**
 * Footer Component
 * Site-wide footer with brand summary, real internal navigation, and contact.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { FiShoppingBag, FiMessageCircle, FiMapPin } from 'react-icons/fi';

const WHATSAPP_NUMBER = process.env.REACT_APP_WHATSAPP_NUMBER;

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-primary-800 text-primary-100">
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Brand */}
          <div>
            <Link to="/" className="mb-3 flex items-center gap-2 text-lg font-bold text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-400 text-white">
                <FiShoppingBag size={16} />
              </span>
              BlessedNet
            </Link>
            <p className="max-w-xs text-sm text-primary-200">
              Wholesale products, sourced right and delivered fast across Ghana.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">Shop</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="text-primary-200 hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/products" className="text-primary-200 hover:text-white transition-colors">All Products</Link></li>
              <li><Link to="/products?flash_sale=true" className="text-primary-200 hover:text-white transition-colors">Flash Sale</Link></li>
              <li><Link to="/cart" className="text-primary-200 hover:text-white transition-colors">Cart</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">Account</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/profile" className="text-primary-200 hover:text-white transition-colors">My Profile</Link></li>
              <li><Link to="/orders" className="text-primary-200 hover:text-white transition-colors">My Orders</Link></li>
              <li><Link to="/login" className="text-primary-200 hover:text-white transition-colors">Login</Link></li>
              <li><Link to="/register" className="text-primary-200 hover:text-white transition-colors">Register</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">Contact</h3>
            <ul className="space-y-3 text-sm">
              {WHATSAPP_NUMBER && (
                <li>
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary-200 hover:text-white transition-colors"
                  >
                    <FiMessageCircle size={16} /> Chat on WhatsApp
                  </a>
                </li>
              )}
              <li className="flex items-center gap-2 text-primary-200">
                <FiMapPin size={16} /> Delivering across Ghana
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-primary-700">
        <div className="mx-auto max-w-7xl px-4 py-5 text-center text-xs text-primary-300">
          &copy; {year} BlessedNet. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
