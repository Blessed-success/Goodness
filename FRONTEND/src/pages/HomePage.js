/**
 * Homepage
 * Main landing page with featured products, flash sales, and trending items
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { productsAPI } from '../api';

const HomePage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [flashSaleProducts, setFlashSaleProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flashSaleCountdown, setFlashSaleCountdown] = useState({});

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]); // Added fetchProducts dependency safely

  useEffect(() => {
    updateCountdowns(); 

    const interval = setInterval(() => {
      updateCountdowns();
    }, 1000);

    return () => clearInterval(interval);
  }, [updateCountdowns]);

  const fetchProducts = React.useCallback(async () => {
    try {
      setLoading(true);

      const featuredRes = await productsAPI.getAll({ featured: true, limit: 6 });
      setProducts(featuredRes.data.data.products);

      const trendingRes = await productsAPI.getAll({ trending: true, limit: 6 });
      setTrendingProducts(trendingRes.data.data.products);

      const flashRes = await productsAPI.getAll({ flash_sale: true, limit: 6 });
      setFlashSaleProducts(flashRes.data.data.products);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, []); // Empty array means this function never changes

  // 2. Wrap updateCountdowns in useCallback
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            🎉 Welcome to BlessedNet Wholesale Hub
          </h1>
          <p className="text-xl md:text-2xl mb-6">
            Your one-stop wholesale marketplace for quality products at competitive prices
          </p>
          <button
            onClick={() => navigate('/products')}
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
          >
            Shop Now 🛍️
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">Loading products... ⏳</p>
          </div>
        ) : (
          <>
            {/* Flash Sale Section */}
            {flashSaleProducts.length > 0 && (
              <section className="mb-12">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-3xl font-bold text-red-600">⚡ Flash Sale</h2>
                  <button
                    onClick={() => navigate('/products?flash_sale=true')}
                    className="text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    View All →
                  </button>
                </div>

                <div className="bg-red-50 p-6 rounded-lg mb-6">
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    {flashSaleProducts.slice(0, 6).map((product) => (
                      <div key={product.id} className="text-center">
                        <div className="text-4xl font-bold text-red-600">
                          {flashSaleCountdown[product.id] || 'Loading...'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {flashSaleProducts.slice(0, 6).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            )}

            {/* Trending Products Section */}
            {trendingProducts.length > 0 && (
              <section className="mb-12">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-3xl font-bold text-orange-600">🔥 Trending Now</h2>
                  <button
                    onClick={() => navigate('/products?trending=true')}
                    className="text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    View All →
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {trendingProducts.slice(0, 6).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            )}

            {/* Featured Products Section */}
            {products.length > 0 && (
              <section>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-3xl font-bold text-blue-600">⭐ Featured Products</h2>
                  <button
                    onClick={() => navigate('/products?featured=true')}
                    className="text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    View All →
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.slice(0, 6).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            )}

            {products.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">No products available at the moment</p>
                <button
                  onClick={() => navigate('/products')}
                  className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Browse All Products
                </button>
              </div>
            )}
          </>
        )}

        {/* Features Section */}
        <section className="mt-16 py-12 bg-white rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="font-bold text-xl mb-2">Quality Assured</h3>
              <p className="text-gray-600">All products are verified for quality and authenticity</p>
            </div>
            <div className="p-6">
              <div className="text-4xl mb-4">🚚</div>
              <h3 className="font-bold text-xl mb-2">Fast Delivery</h3>
              <p className="text-gray-600">Quick and reliable shipping across Ghana</p>
            </div>
            <div className="p-6">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="font-bold text-xl mb-2">Customer Support</h3>
              <p className="text-gray-600">Available 24/7 via WhatsApp and Email</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomePage;
