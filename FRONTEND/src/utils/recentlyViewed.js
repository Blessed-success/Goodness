/**
 * Recently Viewed
 * Frontend-only (localStorage) tracking of the last few products a shopper
 * opened in Quick View — no backend model, mirrors the Compare descope.
 */

const STORAGE_KEY = 'recently_viewed_products';
const MAX_ITEMS = 12;

export const getRecentlyViewed = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const addRecentlyViewed = (product) => {
  if (!product?.id) return;

  const summary = {
    id: product.id,
    name: product.name,
    price: product.price,
    discounted_price: product.discounted_price,
    discount_percent: product.discount_percent,
    image_url: product.image_url,
    rating: product.rating,
    category: product.category,
    stock_quantity: product.stock_quantity,
  };

  const existing = getRecentlyViewed().filter((item) => item.id !== product.id);
  const updated = [summary, ...existing].slice(0, MAX_ITEMS);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage unavailable/full — recently-viewed is a non-critical enhancement
  }
};
