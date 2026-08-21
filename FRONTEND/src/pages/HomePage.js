/**
 * Homepage
 * Main landing page with a full-width hero, featured products, flash
 * sales, and trending items.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  FiShield, FiTruck, FiMessageCircle, FiCreditCard, FiSearch, FiCheckCircle, FiZap,
} from 'react-icons/fi';
import ProductCard from '../components/ProductCard';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import PlaceholderImage from '../components/ui/PlaceholderImage';
import Hero from '../components/home/Hero';
import CountdownTimer from '../components/home/CountdownTimer';
import Reveal from '../components/home/Reveal';
import RecentlyViewedStrip from '../components/home/RecentlyViewedStrip';
import RecommendedForYou from '../components/home/RecommendedForYou';
import { productsAPI, categoriesAPI, heroBannerAPI } from '../api';
import { toWhatsAppNumber } from '../utils/whatsapp';

const WHATSAPP_NUMBER = toWhatsAppNumber(process.env.REACT_APP_WHATSAPP_NUMBER);

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

const SECTION_HEADER = 'text-2xl font-bold text-gray-900 md:text-3xl';

const HomePage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [flashSaleProducts, setFlashSaleProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [heroBanner, setHeroBanner] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProducts = React.useCallback(async () => {
    try {
      setLoading(true);

      const [featuredRes, trendingRes, flashRes, categoriesRes, bannerRes] = await Promise.all([
        productsAPI.getAll({ featured: true, limit: 6 }),
        productsAPI.getAll({ trending: true, limit: 6 }),
        productsAPI.getAll({ flash_sale: true, limit: 6 }),
        categoriesAPI.getAll(),
        heroBannerAPI.getActive().catch(() => ({ data: { data: null } })),
      ]);

      setProducts(featuredRes.data.data.products);
      setTrendingProducts(trendingRes.data.data.products);
      setFlashSaleProducts(flashRes.data.data.products);
      setCategories(categoriesRes.data.data);
      setHeroBanner(bannerRes.data.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const hasAnyProducts = products.length > 0 || flashSaleProducts.length > 0 || trendingProducts.length > 0;

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Nexus Wholesale Hub — Premium Wholesale Marketplace</title>
        <meta
          name="description"
          content="Shop flash sales, trending products, and trusted vendor stores on Nexus — Ghana's premium wholesale marketplace with fast delivery and secure checkout."
        />
      </Helmet>
      <Hero banner={heroBanner} />

      {/* Shop by Category */}
      {categories.length > 0 && (
        <Reveal as="section" id="categories" className="bg-white py-14">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-8 flex items-center justify-between">
              <h2 className={SECTION_HEADER}>Shop by Category</h2>
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
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
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
        </Reveal>
      )}

      <div className="mx-auto max-w-7xl px-4 py-12">
        {loading ? (
          <div className="py-16 text-center text-gray-500">Loading products&hellip;</div>
        ) : (
          <>
            {/* Flash Sale Section */}
            {flashSaleProducts.length > 0 && (
              <Reveal as="section" className="mb-14">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className={`${SECTION_HEADER} flex items-center gap-2`}>
                    <FiZap className="text-accent-500" /> Flash Sale
                  </h2>
                  <button
                    onClick={() => navigate('/products?flash_sale=true')}
                    className="text-sm font-semibold text-primary-600 hover:text-primary-700"
                  >
                    View All &rarr;
                  </button>
                </div>

                <Card className="mb-6 border border-accent-200 bg-accent-50">
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
                    {flashSaleProducts.slice(0, 6).map((product) => (
                      <div key={product.id} className="flex justify-center">
                        {product.flash_sale_end ? (
                          <CountdownTimer endTime={product.flash_sale_end} label="" />
                        ) : (
                          <span className="text-sm font-semibold text-accent-700">Limited stock</span>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>

                <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {flashSaleProducts.slice(0, 6).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </Reveal>
            )}

            {/* Trending Products Section */}
            {trendingProducts.length > 0 && (
              <Reveal as="section" className="mb-14">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className={SECTION_HEADER}>Trending Now</h2>
                  <button
                    onClick={() => navigate('/products?trending=true')}
                    className="text-sm font-semibold text-primary-600 hover:text-primary-700"
                  >
                    View All &rarr;
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {trendingProducts.slice(0, 6).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </Reveal>
            )}

            {/* Featured Products Section */}
            {products.length > 0 && (
              <Reveal as="section">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className={SECTION_HEADER}>Featured Products</h2>
                  <button
                    onClick={() => navigate('/products?featured=true')}
                    className="text-sm font-semibold text-primary-600 hover:text-primary-700"
                  >
                    View All &rarr;
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {products.slice(0, 6).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </Reveal>
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

      <Reveal as="section" className="pb-14">
        <RecommendedForYou />
      </Reveal>

      <Reveal as="section" className="pb-14">
        <RecentlyViewedStrip />
      </Reveal>

      {/* How It Works */}
      <Reveal as="section" className="bg-primary-50/50 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-10 text-center text-2xl font-bold text-gray-900 md:text-3xl">How It Works</h2>
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            {HOW_IT_WORKS.map(({ icon: Icon, title, description }) => (
              <div key={title} className="text-center">
                <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-100">
                  <Icon className="text-primary-700" size={24} />
                </span>
                <h3 className="mb-2 text-lg font-bold text-gray-900">{title}</h3>
                <p className="mx-auto max-w-xs text-sm text-gray-500">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <div className="mx-auto max-w-7xl px-4 pb-16">
        {/* WhatsApp CTA Banner */}
        {WHATSAPP_NUMBER && (
          <Reveal as="section" className="mb-16 overflow-hidden rounded-2xl bg-accent-400">
            <div className="flex flex-col items-center justify-between gap-6 px-8 py-10 text-center md:flex-row md:text-left">
              <div>
                <h2 className="mb-2 text-2xl font-bold text-primary-900">Need a quick quote?</h2>
                <p className="text-primary-800">Chat with us directly on WhatsApp for bulk pricing and fast answers.</p>
              </div>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello, I\'d like to place a bulk order.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-shrink-0 items-center gap-2 rounded-full bg-primary-900 px-6 py-3 font-semibold text-white shadow-sm transition-transform hover:scale-105"
              >
                <FiMessageCircle size={18} /> Chat on WhatsApp
              </a>
            </div>
          </Reveal>
        )}

        {/* Trust / Features Band */}
        <Reveal as="section" className="overflow-hidden rounded-2xl bg-primary-800">
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
        </Reveal>
      </div>
    </div>
  );
};

export default HomePage;
