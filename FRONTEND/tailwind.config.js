/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        // Palette: https://coolors.co/palette/3d5a80-98c1d9-e0fbfc-ee6c4d-293241
        primary: {
          50: '#f2f7fa',
          100: '#e0fbfc',
          200: '#c3e4ef',
          300: '#98c1d9',
          400: '#6f9ebd',
          500: '#527a9e',
          600: '#3d5a80',
          700: '#334a68',
          800: '#293241',
          900: '#1c222e',
          DEFAULT: '#3d5a80',
        },
        accent: {
          50: '#fef3ef',
          100: '#fde3d8',
          200: '#fac2ad',
          300: '#f5977a',
          400: '#ee6c4d',
          500: '#e14f2c',
          600: '#c43c1d',
          700: '#9c3018',
          DEFAULT: '#ee6c4d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(0, 0, 0, 0.05), 0 1px 3px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
      },
      borderRadius: {
        xl: '0.875rem',
      },
    },
  },
  plugins: [],
};
