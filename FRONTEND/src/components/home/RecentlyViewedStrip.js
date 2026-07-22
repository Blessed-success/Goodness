/**
 * RecentlyViewedStrip
 * Horizontal-scroll row of products the shopper recently opened in Quick
 * View (read from localStorage), re-fetched fresh from the API so price/
 * stock/rating stay current rather than showing a stale cached snapshot.
 */

import React, { useEffect, useState } from 'react';
import { productsAPI } from '../../api';
import { getRecentlyViewed } from '../../utils/recentlyViewed';
import ProductCard from '../ProductCard';

const RecentlyViewedStrip = ({ excludeProductId }) => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const viewed = getRecentlyViewed().filter((item) => item.id !== excludeProductId);
    if (viewed.length === 0) return;

    const ids = viewed.map((item) => item.id).join(',');
    productsAPI
      .getAll({ ids, limit: viewed.length })
      .then((response) => {
        const byId = new Map(response.data.data.products.map((p) => [p.id, p]));
        // Preserve most-recently-viewed-first order from localStorage
        const ordered = viewed.map((item) => byId.get(item.id)).filter(Boolean);
        setProducts(ordered);
      })
      .catch(() => setProducts([]));
  }, [excludeProductId]);

  if (products.length === 0) return null;

  return (
    <div className="mx-auto max-w-7xl px-4">
      <h2 className="mb-4 text-xl font-bold text-gray-900">Recently Viewed</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {products.map((product) => (
          <div key={product.id} className="w-64 flex-shrink-0">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentlyViewedStrip;
