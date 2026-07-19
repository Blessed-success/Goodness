/**
 * Homepage
 * Main landing page with featured products, flash sales, and trending items
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowRight, FiShield, FiTruck, FiMessageCircle, FiCreditCard, FiMapPin,
  FiSearch, FiCheckCircle,
} from 'react-icons/fi';
import ProductCard from '../components/ProductCard';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import PlaceholderImage from '../components/ui/PlaceholderImage';
import { productsAPI, categoriesAPI } from '../api';

const WHATSAPP_NUMBER = process.env.REACT_APP_WHATSAPP_NUMBER;

const TRUST_POINTS = [
  { icon: FiCreditCard, label: 'Secure payments via Paystack' },
  { icon: FiMessageCircle, label: 'Order direct on WhatsApp' },
  { icon: FiMapPin, label: 'Delivery across Ghana' },
];

const HOW_IT_WORKS = [
  { icon: FiSearch, title: 'Browse & Order', description: 'Explore wholesale products by category and add what you need to your cart.' },
  { icon: FiCreditCard, title: 'Secure Checkout', description: 'Pay securely with Paystack, or place your order directly on WhatsApp.' },
  { icon: FiTruck, title: 'Fast Delivery', description: 'We deliver across Ghana and keep you updated on your order status.' },
];

const CATEGORY_TILE_COLORS = [
  'from-primary-600 to-primary-800',
  'from-accent-400 to-accent-600',
  'from-primary-400 to-primary-700',
  'from-accent-500 to-primary-800',
];

const HomePage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [flashSaleProducts, setFlashSaleProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [heroProducts, setHeroProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flashSaleCountdown, setFlashSaleCountdown] = useState({});

  const fetchProducts = React.useCallback(async () => {
    try {
      setLoading(true);

      const [featuredRes, trendingRes, flashRes, categoriesRes, recentRes] = await Promise.all([
        productsAPI.getAll({ featured: true, limit: 6 }),
        productsAPI.getAll({ trending: true, limit: 6 }),
        productsAPI.getAll({ flash_sale: true, limit: 6 }),
        categoriesAPI.getAll(),
        productsAPI.getAll({ limit: 4, sort: 'created_at', order: 'desc' }),
      ]);

      setProducts(featuredRes.data.data.products);
      setTrendingProducts(trendingRes.data.data.products);
      setFlashSaleProducts(flashRes.data.data.products);
      setCategories(categoriesRes.data.data);
      setHeroProducts(recentRes.data.data.products);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCountdowns = React.useCallback(() => {
    const countdowns = {};
    flashSaleProducts.forEach((product) => {
      if (product.flash_sale_end) {
        const endTime = new Date(product.flash_sale_end).getTime();
        const now = new Date().getTime();
        const timeLeft = endTime - now;

        if (timeLeft > 0) {
          const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

          countdowns[product.id] = `${hours}h ${minutes}m ${seconds}s`;
        } else {
          countdowns[product.id] = 'Ended';
        }
      }
    });
    setFlashSaleCountdown(countdowns);
  }, [flashSaleProducts]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    updateCountdowns();
    const interval = setInterval(updateCountdowns, 1000);
    return () => clearInterval(interval);
  }, [updateCountdowns]);

  const hasAnyProducts = products.length > 0 || flashSaleProducts.length > 0 || trendingProducts.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative overflow-hidden bg-primary-800">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent-400/20 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-primary-300/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="mb-4 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-100">
              Wholesale Marketplace &middot; Ghana
            </span>
            <h1 className="mb-5 text-4xl font-bold leading-tight text-white md:text-5xl">
              Wholesale, sourced right<br />and delivered fast
            </h1>
            <p className="mb-8 max-w-lg text-lg text-primary-100">
              Quality products at competitive bulk prices, with secure checkout
              and delivery across Ghana.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={() => navigate('/products')}
                className="!bg-accent-400 hover:!bg-accent-500"
              >
                Shop Now <FiArrowRight />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' })}
                className="!border-white/30 !bg-transparent !text-white hover:!bg-white/10"
              >
                Browse Categories
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
              {TRUST_POINTS.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-sm text-primary-100">
                  <Icon size={16} className="text-accent-400" />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Floating product preview */}
          <div className="relative hidden h-96 md:block">
            {heroProducts.slice(0, 4).map((product, idx) => {
              const positions = [
                'left-4 top-2 w-48 rotate-[-4deg] z-20',
                'right-0 top-16 w-48 rotate-[3deg] z-10',
                'left-16 bottom-4 w-44 rotate-[2deg] z-10',
                'right-8 bottom-0 w-40 rotate-[-3deg] z-0',
              ];
              return (
                <div key={product.id} className={`absolute ${positions[idx]}`}>
                  <Card padded={false} className="overflow-hidden shadow-card-hover">
                    <div className="h-28 bg-gray-100">
                      <PlaceholderImage
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <p className="truncate text-xs font-semibold text-gray-900">{product.name}</p>
                      <p className="text-sm font-bold text-primary-700">GHS {product.price.toFixed(2)}</p>
                    </div>
                  </Card>
                </div>
              );
            })}
            {heroProducts.length === 0 && (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-white/20 text-primary-200">
                Products will preview here
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shop by Category */}
      {categories.length > 0 && (
        <section id="categories" className="bg-white py-14">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Shop by Category</h2>
              <button
                onClick={() => navigate('/products')}
                className="text-sm font-semibold text-primary-600 hover:text-primary-700"
              >
                View All &rarr;
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {categories.slice(0, 8).map((category, idx) => (
                <button
                  key={category.name}
                  onClick={() => navigate(`/products?category=${encodeURIComponent(category.name)}`)}
                  className="group text-left"
                >
                  <Card
                    padded={false}
                    hoverable
                    className="mb-3 aspect-square overflow-hidden"
                  >
                    {category.image_url ? (
                      <PlaceholderImage
                        src={category.image_url}
                        alt={category.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div
                        className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${CATEGORY_TILE_COLORS[idx % CATEGORY_TILE_COLORS.length]}`}
                      >
                        <span className="text-4xl font-bold text-white/90">
                          {category.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </Card>
                  <p className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                    {category.name}
                  </p>
                  <p className="text-sm text-gray-500">Shop now</p>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="mx-auto max-w-7xl px-4 py-12">
        {loading ? (
          <div className="py-16 text-center text-gray-500">Loading products&hellip;</div>
        ) : (
          <>
            {/* Flash Sale Section */}
            {flashSaleProducts.length > 0 && (
              <section className="mb-14">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Flash Sale</h2>
                  <button
                    onClick={() => navigate('/products?flash_sale=true')}
                    className="text-sm font-semibold text-primary-600 hover:text-primary-700"
                  >
                    View All &rarr;
                  </button>
                </div>

                <Card className="mb-6 border border-accent-100 bg-accent-50">
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
                    {flashSaleProducts.slice(0, 6).map((product) => (
                      <div key={product.id} className="text-center">
                        <div className="text-lg font-bold text-accent-600">
                          {flashSaleCountdown[product.id] || 'Loading...'}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {flashSaleProducts.slice(0, 6).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            )}

            {/* Trending Products Section */}
            {trendingProducts.length > 0 && (
              <section className="mb-14">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Trending Now</h2>
                  <button
                    onClick={() => navigate('/products?trending=true')}
                    className="text-sm font-semibold text-primary-600 hover:text-primary-700"
                  >
                    View All &rarr;
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {trendingProducts.slice(0, 6).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            )}

            {/* Featured Products Section */}
            {products.length > 0 && (
              <section>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
                  <button
                    onClick={() => navigate('/products?featured=true')}
                    className="text-sm font-semibold text-primary-600 hover:text-primary-700"
                  >
                    View All &rarr;
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {products.slice(0, 6).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            )}

            {!hasAnyProducts && (
              <Card className="py-16 text-center">
                <p className="mb-4 text-lg text-gray-600">No products available at the moment</p>
                <Button onClick={() => navigate('/products')}>Browse All Products</Button>
              </Card>
            )}
          </>
        )}
      </div>

      {/* How It Works */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-10 text-center text-2xl font-bold text-gray-900">How It Works</h2>
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            {HOW_IT_WORKS.map(({ icon: Icon, title, description }) => (
              <div key={title} className="text-center">
                <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50">
                  <Icon className="text-primary-600" size={24} />
                </span>
                <h3 className="mb-2 text-lg font-bold text-gray-900">{title}</h3>
                <p className="mx-auto max-w-xs text-sm text-gray-500">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pb-16">
        {/* WhatsApp CTA Banner */}
        {WHATSAPP_NUMBER && (
          <section className="mb-16 overflow-hidden rounded-2xl bg-accent-400">
            <div className="flex flex-col items-center justify-between gap-6 px-8 py-10 text-center md:flex-row md:text-left">
              <div>
                <h2 className="mb-2 text-2xl font-bold text-white">Need a quick quote?</h2>
                <p className="text-accent-50">Chat with us directly on WhatsApp for bulk pricing and fast answers.</p>
              </div>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello, I\'d like to place a bulk order.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-accent-600 shadow-sm transition-transform hover:scale-105"
              >
                <FiMessageCircle size={18} /> Chat on WhatsApp
              </a>
            </div>
          </section>
        )}

        {/* Trust / Features Band */}
        <section className="overflow-hidden rounded-2xl bg-primary-800">
          <div className="grid grid-cols-1 gap-px bg-primary-700 md:grid-cols-3">
            <div className="bg-primary-800 p-8 text-center">
              <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-400/20">
                <FiShield className="text-accent-400" size={22} />
              </span>
              <h3 className="mb-1 text-lg font-bold text-white">Quality Assured</h3>
              <p className="text-sm text-primary-200">All products are verified for quality and authenticity</p>
            </div>
            <div className="bg-primary-800 p-8 text-center">
              <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-400/20">
                <FiTruck className="text-accent-400" size={22} />
              </span>
              <h3 className="mb-1 text-lg font-bold text-white">Fast Delivery</h3>
              <p className="text-sm text-primary-200">Quick and reliable shipping across Ghana</p>
            </div>
            <div className="bg-primary-800 p-8 text-center">
              <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-400/20">
                <FiCheckCircle className="text-accent-400" size={22} />
              </span>
              <h3 className="mb-1 text-lg font-bold text-white">Customer Support</h3>
              <p className="text-sm text-primary-200">Reach us anytime via WhatsApp and email</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomePage;
