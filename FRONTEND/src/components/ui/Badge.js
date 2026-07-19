import React from 'react';

const VARIANT_CLASSES = {
  primary: 'bg-primary-50 text-primary-700',
  success: 'bg-green-50 text-green-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-600',
  neutral: 'bg-gray-100 text-gray-700',
  dark: 'bg-gray-900 text-white',
};

const Badge = ({ variant = 'neutral', icon: Icon, className = '', children }) => {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold
        ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
};

export default Badge;
