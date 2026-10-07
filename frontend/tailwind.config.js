/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#15213b',
        muted: '#71809a',
        accent: '#6157e9',
        canvas: '#f7f8fc',
      },
      boxShadow: {
        soft: '0 14px 44px -24px rgba(31, 41, 72, 0.22)',
        lift: '0 24px 64px -28px rgba(55, 52, 123, 0.24)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'soft-pulse': {
          '0%, 100%': { opacity: '0.55', transform: 'scale(0.98)' },
          '50%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 500ms ease-out both',
        'soft-pulse': 'soft-pulse 2.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
