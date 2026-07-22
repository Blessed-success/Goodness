/**
 * OfferTicker
 * Horizontally auto-scrolling strip of short promo lines, pipe-separated
 * ("|") in the admin-editable hero banner's ticker_text field.
 */

import React from 'react';
import { FiTag } from 'react-icons/fi';

const OfferTicker = ({ text, className = '' }) => {
  const items = (text || '')
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean);

  if (items.length === 0) return null;

  return (
    <div className={`overflow-hidden bg-primary-900 ${className}`} aria-label="Current offers">
      <div className="ticker-track flex w-max items-center gap-10 whitespace-nowrap py-2.5">
        {[...items, ...items].map((item, idx) => (
          <span key={idx} className="flex items-center gap-2 text-sm font-medium text-accent-200">
            <FiTag size={13} className="text-accent-400" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

export default OfferTicker;
