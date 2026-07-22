/**
 * Compare Context
 * Lets a shopper pick up to a handful of products to compare side by side.
 * Purely local (localStorage) — no backend model, no login required.
 */

import React, { createContext, useState, useContext, useEffect } from 'react';

const STORAGE_KEY = 'compare_product_ids';
const MAX_COMPARE_ITEMS = 4;

const CompareContext = createContext();

const readStoredIds = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const CompareProvider = ({ children }) => {
  const [productIds, setProductIds] = useState(readStoredIds);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(productIds));
  }, [productIds]);

  const isComparing = (productId) => productIds.includes(productId);

  const toggleCompare = (productId) => {
    setProductIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }
      if (prev.length >= MAX_COMPARE_ITEMS) {
        return prev;
      }
      return [...prev, productId];
    });
  };

  const removeFromCompare = (productId) => {
    setProductIds((prev) => prev.filter((id) => id !== productId));
  };

  const clearCompare = () => setProductIds([]);

  return (
    <CompareContext.Provider
      value={{
        productIds,
        isComparing,
        toggleCompare,
        removeFromCompare,
        clearCompare,
        itemCount: productIds.length,
        maxItems: MAX_COMPARE_ITEMS,
        isFull: productIds.length >= MAX_COMPARE_ITEMS,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within CompareProvider');
  }
  return context;
};
