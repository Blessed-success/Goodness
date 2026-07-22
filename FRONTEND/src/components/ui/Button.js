import React from 'react';

const VARIANT_CLASSES = {
  primary: 'bg-accent-400 text-primary-900 hover:bg-accent-500 focus-visible:ring-accent-500 disabled:bg-accent-200 disabled:text-primary-400',
  secondary: 'bg-gray-900 text-white hover:bg-gray-800 focus-visible:ring-gray-500 disabled:bg-gray-400',
  outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus-visible:ring-primary-500 disabled:text-gray-300',
  ghost: 'text-gray-600 hover:bg-gray-100 focus-visible:ring-gray-400 disabled:text-gray-300',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 disabled:bg-red-300',
};

const SIZE_CLASSES = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
};

const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  children,
  ...props
}) => {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-lg font-semibold
        transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-offset-2 disabled:cursor-not-allowed
        ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      )}
      {children}
    </button>
  );
};

export default Button;
