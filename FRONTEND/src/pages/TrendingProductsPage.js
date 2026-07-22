/**
 * Trending Products Today
 * Shows the top winning products based on demand, rating, and price.
 */

import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { automationAPI } from '../api';

const TrendingProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTrending();
  }, []);

  const loadTrending = async () => {
    try {
      setLoading(true);
      const response = await automationAPI.getTrendingProducts({ limit: 10 });
      setProducts(response.data.data.trending_products);
    } catch (err) {
      Swal.fire('Error', 'Failed to load trending products', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Trending Products Today</h2>
          <p className="text-gray-600 mt-1">Top winning products with strong demand and profit potential.</p>
        </div>

        <button
          onClick={loadTrending}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Refresh List
        </button>

        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-600">Loading trending products...</div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-600">No trending products found yet.</div>
          ) : (
            products.map((product, index) => (
              <div key={product.product_id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Rank #{index + 1}</p>
                    <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-600">Category: {product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">GHS {product.price.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">Suggested: GHS {product.suggested_price.toFixed(2)}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-700">
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="font-semibold">Orders</p>
                    <p>{product.orders_count}</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-3">
                    <p className="font-semibold">Rating</p>
                    <p>{product.rating?.toFixed(1) || '—'}</p>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-3">
                    <p className="font-semibold">Score</p>
                    <p>{product.score}</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3">
                    <p className="font-semibold">Profit Margin</p>
                    <p>{product.profit_margin_percent}%</p>
                  </div>
                </div>

                {product.source_url && (
                  <div className="mt-4 text-sm text-blue-700">
                    Source: <a href={product.source_url} target="_blank" rel="noreferrer" className="underline">View</a>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
  );
};

export default TrendingProductsPage;
