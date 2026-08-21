/**
 * Store Page
 * Public storefront for a single marketplace vendor
 */

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiStar, FiShoppingBag, FiMessageCircle } from 'react-icons/fi';
import { vendorAPI, productsAPI } from '../api';
import ProductCard from '../components/ProductCard';
import PlaceholderImage from '../components/ui/PlaceholderImage';
import Card from '../components/ui/Card';

const StorePage = () => {
  const { slug } = useParams();
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    vendorAPI
      .getBySlug(slug)
      .then((response) => {
        const v = response.data.data;
        setVendor(v);
        return productsAPI.getAll({ vendor_id: v.id, limit: 24 });
      })
      .then((response) => setProducts(response?.data.data.products || []))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <div className="py-16 text-center text-gray-500">Loading&hellip;</div>;
  }

  if (notFound || !vendor) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg text-gray-600">Store not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>{vendor.store_name} — Nexus Wholesale Hub</title>
        <meta name="description" content={vendor.description || `Shop ${vendor.store_name}'s products on Nexus Wholesale Hub.`} />
      </Helmet>
      <div className="h-40 bg-primary-800 md:h-56">
        {vendor.banner_url && (
          <PlaceholderImage src={vendor.banner_url} alt="" className="h-full w-full object-cover" />
        )}
      </div>

      <div className="mx-auto max-w-7xl px-4">
        <div className="-mt-10 mb-8 flex items-end gap-4">
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white shadow-card">
            {vendor.logo_url ? (
              <PlaceholderImage src={vendor.logo_url} alt={vendor.store_name} className="h-full w-full object-cover" />
            ) : (
              <FiShoppingBag className="text-primary-600" size={28} />
            )}
          </div>
          <div className="pb-1">
            <h1 className="text-2xl font-bold text-gray-900">{vendor.store_name}</h1>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              {vendor.rating && (
                <span className="flex items-center gap-1">
                  <FiStar className="text-amber-400" fill="#fbbf24" size={14} /> {vendor.rating}
                </span>
              )}
              <span>{vendor.product_count} products</span>
            </div>
          </div>
          {vendor.whatsapp_number && (
            <a
              href={`https://wa.me/${vendor.whatsapp_number.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${vendor.store_name}, I saw your store on Nexus and I'd like to ask about your products.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-1 flex flex-shrink-0 items-center gap-2 rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700"
            >
              <FiMessageCircle size={16} /> Chat on WhatsApp
            </a>
          )}
        </div>

        {vendor.description && (
          <Card className="mb-8">
            <p className="text-gray-600">{vendor.description}</p>
          </Card>
        )}

        {products.length === 0 ? (
          <p className="pb-16 text-gray-500">This store hasn't listed any products yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 pb-16 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StorePage;
