/**
 * Products Page
 * Browse all products with search, filtering, and sorting
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { productsAPI } from '../api';
import axios from 'axios';

const ProductsPage = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [bestDealProducts, setBestDealProducts] = useState(new Set());

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    fetchBestDeals();
  }, [selectedCategory, searchTerm, sortBy, sortOrder, page]);

  const fetchCategories = async () => {
    try {
      const response = await productsAPI.getCategories();
      setCategories(response.data.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const params = {
        page,
        limit: 12,
        sort: sortBy,
        order: sortOrder,
      };

      if (selectedCategory) {
        params.category = selectedCategory;
      }

      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await productsAPI.getAll(params);
      setProducts(response.data.data.products);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBestDeals = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return; // Only fetch for authenticated users

      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/competitor/best-deals`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const bestDealIds = new Set(response.data.data.best_deal_product_ids || []);
      setBestDealProducts(bestDealIds);
    } catch (error) {
      console.error('Failed to fetch best deals:', error);
      // Don't show error to user, just continue without best deal badges
    }
  };

  const handleFilterReset = () => {
    setSelectedCategory('');
    setSearchTerm('');
    setSortBy('created_at');
    setSortOrder('desc');
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">🛍️ All Products</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Filters</h2>

              {/* Category Filter */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Category</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={selectedCategory === ''}
                      onChange={() => setSelectedCategory('')}
                      className="mr-2"
                    />
                    All Categories
                  </label>
                  {categories.map((category) => (
                    <label key={category} className="flex items-center">
                      <input
                        type="radio"
                        checked={selectedCategory === category}
                        onChange={() => setSelectedCategory(category)}
                        className="mr-2"
                      />
                      {category}
                    </label>
                  ))}
                </div>
              </div>

              {/* Sort By */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Sort By</h3>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(1);
                  }}
                  className="w-full border border-gray-300 rounded px-3 py-2 mb-3"
                >
                  <option value="created_at">Newest</option>
                  <option value="name">Name</option>
                  <option value="price">Price</option>
                  <option value="rating">Rating</option>
                </select>

                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={sortOrder === 'asc'}
                      onChange={() => {
                        setSortOrder('asc');
                        setPage(1);
                      }}
                      className="mr-2"
                    />
                    Low to High
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={sortOrder === 'desc'}
                      onChange={() => {
                        setSortOrder('desc');
                        setPage(1);
                      }}
                      className="mr-2"
                    />
                    High to Low
                  </label>
                </div>
              </div>

              {/* Reset Button */}
              <button
                onClick={handleFilterReset}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="md:col-span-3">
            {/* Search Bar */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Active Filters */}
            {(selectedCategory || searchTerm) && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  {selectedCategory && (
                    <span className="inline-block mr-3 bg-blue-200 px-3 py-1 rounded-full">
                      Category: {selectedCategory} ✕
                    </span>
                  )}
                  {searchTerm && (
                    <span className="inline-block bg-blue-200 px-3 py-1 rounded-full">
                      Search: {searchTerm} ✕
                    </span>
                  )}
                </p>
              </div>
            )}

            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">Loading products... ⏳</p>
              </div>
            ) : products.length > 0 ? (
              <>
                {/* Results Count */}
                <div className="mb-4 text-gray-600">
                  Showing {products.length} of {pagination.total} products
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isBestDeal={bestDealProducts.has(product.id)}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={!pagination.has_prev}
                      className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50"
                    >
                      ← Previous
                    </button>

                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`px-3 py-2 rounded ${
                          p === page
                            ? 'bg-blue-600 text-white'
                            : 'border hover:bg-gray-100'
                        }`}
                      >
                        {p}
                      </button>
                    ))}

                    <button
                      onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                      disabled={!pagination.has_next}
                      className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg mb-4">No products found</p>
                <button
                  onClick={handleFilterReset}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
