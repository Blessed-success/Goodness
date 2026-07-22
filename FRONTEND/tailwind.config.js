/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        // Luxury green marketplace palette: deep green (brand/dark surfaces) + light green (CTAs)
        primary: {
          50: '#eef6f1',
          100: '#d6eadd',
          200: '#aad4bc',
          300: '#78b896',
          400: '#4e9c74',
          500: '#2f7f57',
          600: '#1f6644',
          700: '#175036',
          800: '#123d2a',
          900: '#0c2a1d',
          DEFAULT: '#175036',
        },
        accent: {
          50: '#f3fbf0',
          100: '#e3f6db',
          200: '#c6edb9',
          300: '#a3e092',
          400: '#82d06e',
          500: '#63b84f',
          600: '#4b9a3a',
          700: '#3a7a2d',
          DEFAULT: '#82d06e',
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
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-14px) scale(1.03)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(130, 208, 110, 0.55)' },
          '50%': { boxShadow: '0 0 0 8px rgba(130, 208, 110, 0)' },
        },
        'ken-burns': {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.12)' },
        },
      },
      animation: {
        marquee: 'marquee 22s linear infinite',
        'fade-in-up': 'fade-in-up 0.7s ease-out forwards',
        float: 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-out infinite',
        'ken-burns': 'ken-burns 18s ease-out infinite alternate',
      },
    },
  },
  plugins: [],
};
