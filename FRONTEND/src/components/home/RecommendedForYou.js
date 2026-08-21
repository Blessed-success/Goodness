/**
 * RecommendedForYou
 * Lightweight heuristic personalization (no AI/ML, no external API): picks
 * the most common category among the products this browser has recently
 * viewed (see utils/recentlyViewed) and shows more from that category.
 * Falls back to featured products when there's no browsing signal yet.
 */

import React, { useEffect, useState } from 'react';
import { productsAPI } from '../../api';
import { getRecentlyViewed } from '../../utils/recentlyViewed';
import ProductCard from '../ProductCard';

const topCategory = (viewed) => {
  const counts = {};
  viewed.forEach((item) => {
    if (!item.category) return;
    counts[item.category] = (counts[item.category] || 0) + 1;
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] || null;
};

const RecommendedForYou = () => {
  const [products, setProducts] = useState([]);
  const [heading, setHeading] = useState('Recommended For You');

  useEffect(() => {
    const viewed = getRecentlyViewed();
    const viewedIds = new Set(viewed.map((item) => item.id));
    const category = topCategory(viewed);

    const load = async () => {
      if (category) {
        const response = await productsAPI.getAll({ category, limit: 12 });
        const filtered = response.data.data.products.filter((p) => !viewedIds.has(p.id));
        if (filtered.length > 0) {
          setHeading(`More in ${category}`);
          setProducts(filtered.slice(0, 8));
          return;
        }
      }
      const fallback = await productsAPI.getAll({ featured: true, limit: 8 });
      setHeading('Recommended For You');
      setProducts(fallback.data.data.products);
    };

    load().catch(() => setProducts([]));
  }, []);

  if (products.length === 0) return null;

  return (
    <div className="mx-auto max-w-7xl px-4">
      <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">{heading}</h2>
      <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default RecommendedForYou;
