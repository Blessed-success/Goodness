import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

/**
 * Windowed pagination: first/last page + a window around the current page,
 * with ellipses for gaps, instead of rendering a button per page.
 */
const getPageWindow = (page, pages, windowSize = 2) => {
  const items = [];
  const start = Math.max(2, page - windowSize);
  const end = Math.min(pages - 1, page + windowSize);

  items.push(1);
  if (start > 2) items.push('ellipsis-start');
  for (let p = start; p <= end; p++) items.push(p);
  if (end < pages - 1) items.push('ellipsis-end');
  if (pages > 1) items.push(pages);

  return items;
};

const Pagination = ({ page, pages, onChange, hasPrev = page > 1, hasNext = page < pages }) => {
  if (!pages || pages <= 1) return null;

  const items = getPageWindow(page, pages);

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Pagination">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={!hasPrev}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200
          text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Previous page"
      >
        <FiChevronLeft size={16} />
      </button>

      {items.map((item, idx) =>
        typeof item === 'number' ? (
          <button
            key={item}
            onClick={() => onChange(item)}
            aria-current={item === page ? 'page' : undefined}
            className={`h-9 min-w-9 rounded-lg px-3 text-sm font-medium transition-colors ${
              item === page
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {item}
          </button>
        ) : (
          <span key={item + idx} className="px-1 text-gray-400">
            &hellip;
          </span>
        )
      )}

      <button
        onClick={() => onChange(Math.min(pages, page + 1))}
        disabled={!hasNext}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200
          text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Next page"
      >
        <FiChevronRight size={16} />
      </button>
    </nav>
  );
};

export default Pagination;
