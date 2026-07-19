/**
 * Products Page
 * Browse all products with search, filtering, and sorting
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiX } from 'react-icons/fi';
import ProductCard from '../components/ProductCard';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Pagination from '../components/ui/Pagination';
import PriceRangeSlider from '../components/ui/PriceRangeSlider';
import { productsAPI } from '../api';
import axios from 'axios';

const RATING_OPTIONS = [4, 3, 2];

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

  // Price range
  const [priceBounds, setPriceBounds] = useState(null); // { min, max } from the catalog
  const [priceRange, setPriceRange] = useState(null); // [minVal, maxVal] currently selected
  const [debouncedPriceRange, setDebouncedPriceRange] = useState(null);
  const [minRating, setMinRating] = useState(0);
  const [onSale, setOnSale] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchPriceBounds();
    fetchBestDeals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce price slider drags so we don't fire a request per pixel moved
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedPriceRange(priceRange), 350);
    return () => clearTimeout(timer);
  }, [priceRange]);

  useEffect(() => {
    if (priceBounds && !debouncedPriceRange) return; // wait for initial bounds
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, searchTerm, sortBy, sortOrder, page, debouncedPriceRange, minRating, onSale]);

  const fetchCategories = async () => {
    try {
      const response = await productsAPI.getCategories();
      setCategories(response.data.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchPriceBounds = async () => {
    try {
      const response = await productsAPI.getPriceRange();
      const { min_price, max_price } = response.data.data;
      const bounds = { min: Math.floor(min_price), max: Math.max(Math.ceil(max_price), Math.floor(min_price) + 1) };
      setPriceBounds(bounds);
      setPriceRange([bounds.min, bounds.max]);
      setDebouncedPriceRange([bounds.min, bounds.max]);
    } catch (error) {
      console.error('Failed to fetch price range:', error);
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

      if (debouncedPriceRange && priceBounds) {
        if (debouncedPriceRange[0] > priceBounds.min) params.min_price = debouncedPriceRange[0];
        if (debouncedPriceRange[1] < priceBounds.max) params.max_price = debouncedPriceRange[1];
      }

      if (minRating > 0) {
        params.min_rating = minRating;
      }

      if (onSale) {
        params.on_sale = true;
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
      if (!token) return;

      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/competitor/best-deals`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const bestDealIds = new Set(response.data.data.best_deal_product_ids || []);
      setBestDealProducts(bestDealIds);
    } catch (error) {
      // Best-deal badges are a bonus signal; fail silently for the shopper.
    }
  };

  const handleFilterReset = () => {
    setSelectedCategory('');
    setSearchTerm('');
    setSortBy('created_at');
    setSortOrder('desc');
    setMinRating(0);
    setOnSale(false);
    if (priceBounds) {
      setPriceRange([priceBounds.min, priceBounds.max]);
      setDebouncedPriceRange([priceBounds.min, priceBounds.max]);
    }
    setPage(1);
  };

  const isPriceFiltered =
    priceBounds && debouncedPriceRange &&
    (debouncedPriceRange[0] > priceBounds.min || debouncedPriceRange[1] < priceBounds.max);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">All Products</h1>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Filters Sidebar */}
          <div className="md:col-span-1">
            <Card>
              <h2 className="mb-4 text-lg font-bold text-gray-900">Filters</h2>

              <div className="mb-6">
                <h3 className="mb-3 text-sm font-semibold text-gray-700">Category</h3>
                <div className="space-y-2 text-sm">
                  <label className="flex items-center gap-2 text-gray-600">
                    <input
                      type="radio"
                      checked={selectedCategory === ''}
                      onChange={() => setSelectedCategory('')}
                      className="text-primary-600"
                    />
                    All Categories
                  </label>
                  {categories.map((category) => (
                    <label key={category} className="flex items-center gap-2 text-gray-600">
                      <input
                        type="radio"
                        checked={selectedCategory === category}
                        onChange={() => setSelectedCategory(category)}
                        className="text-primary-600"
                      />
                      {category}
                    </label>
                  ))}
                </div>
              </div>

              {priceBounds && priceRange && (
                <div className="mb-6">
                  <h3 className="mb-3 text-sm font-semibold text-gray-700">Price Range</h3>
                  <PriceRangeSlider
                    min={priceBounds.min}
                    max={priceBounds.max}
                    value={priceRange}
                    onChange={(next) => {
                      setPriceRange(next);
                      setPage(1);
                    }}
                  />
                </div>
              )}

              <div className="mb-6">
                <h3 className="mb-3 text-sm font-semibold text-gray-700">Minimum Rating</h3>
                <div className="space-y-2 text-sm">
                  <label className="flex items-center gap-2 text-gray-600">
                    <input
                      type="radio"
                      checked={minRating === 0}
                      onChange={() => {
                        setMinRating(0);
                        setPage(1);
                      }}
                      className="text-primary-600"
                    />
                    Any Rating
                  </label>
                  {RATING_OPTIONS.map((r) => (
                    <label key={r} className="flex items-center gap-2 text-gray-600">
                      <input
                        type="radio"
                        checked={minRating === r}
                        onChange={() => {
                          setMinRating(r);
                          setPage(1);
                        }}
                        className="text-primary-600"
                      />
                      {r}+ Stars
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={onSale}
                    onChange={(e) => {
                      setOnSale(e.target.checked);
                      setPage(1);
                    }}
                    className="rounded text-primary-600"
                  />
                  On Sale Only
                </label>
              </div>

              <div className="mb-6">
                <h3 className="mb-3 text-sm font-semibold text-gray-700">Sort By</h3>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(1);
                  }}
                  className="mb-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                >
                  <option value="created_at">Newest</option>
                  <option value="name">Name</option>
                  <option value="price">Price</option>
                  <option value="rating">Rating</option>
                </select>

                <div className="space-y-2 text-sm">
                  <label className="flex items-center gap-2 text-gray-600">
                    <input
                      type="radio"
                      checked={sortOrder === 'asc'}
                      onChange={() => {
                        setSortOrder('asc');
                        setPage(1);
                      }}
                      className="text-primary-600"
                    />
                    Low to High
                  </label>
                  <label className="flex items-center gap-2 text-gray-600">
                    <input
                      type="radio"
                      checked={sortOrder === 'desc'}
                      onChange={() => {
                        setSortOrder('desc');
                        setPage(1);
                      }}
                      className="text-primary-600"
                    />
                    High to Low
                  </label>
                </div>
              </div>

              <Button variant="outline" fullWidth onClick={handleFilterReset}>
                Reset Filters
              </Button>
            </Card>
          </div>

          {/* Products Grid */}
          <div className="md:col-span-3">
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-500 focus:outline-none"
              />
            </div>

            {(selectedCategory || searchTerm || isPriceFiltered || minRating > 0 || onSale) && (
              <div className="mb-6 flex flex-wrap gap-2">
                {selectedCategory && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-sm text-primary-700">
                    Category: {selectedCategory}
                    <button onClick={() => setSelectedCategory('')}>
                      <FiX size={14} />
                    </button>
                  </span>
                )}
                {searchTerm && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-sm text-primary-700">
                    Search: {searchTerm}
                    <button onClick={() => setSearchTerm('')}>
                      <FiX size={14} />
                    </button>
                  </span>
                )}
                {isPriceFiltered && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-sm text-primary-700">
                    Price: GHS {priceRange[0]}&ndash;{priceRange[1]}
                    <button
                      onClick={() => {
                        setPriceRange([priceBounds.min, priceBounds.max]);
                        setDebouncedPriceRange([priceBounds.min, priceBounds.max]);
                      }}
                    >
                      <FiX size={14} />
                    </button>
                  </span>
                )}
                {minRating > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-sm text-primary-700">
                    {minRating}+ Stars
                    <button onClick={() => setMinRating(0)}>
                      <FiX size={14} />
                    </button>
                  </span>
                )}
                {onSale && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-sm text-primary-700">
                    On Sale
                    <button onClick={() => setOnSale(false)}>
                      <FiX size={14} />
                    </button>
                  </span>
                )}
              </div>
            )}

            {loading ? (
              <div className="py-16 text-center text-gray-500">Loading products&hellip;</div>
            ) : products.length > 0 ? (
              <>
                <div className="mb-4 text-sm text-gray-500">
                  Showing {products.length} of {pagination.total} products
                </div>

                <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isBestDeal={bestDealProducts.has(product.id)}
                    />
                  ))}
                </div>

                <Pagination page={page} pages={pagination.pages} onChange={setPage} />
              </>
            ) : (
              <div className="py-16 text-center">
                <p className="mb-4 text-lg text-gray-600">No products found</p>
                <Button onClick={handleFilterReset}>Reset Filters</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
