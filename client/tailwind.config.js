/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        forest: {
          950: '#030d07',
          900: '#071a0e',
          800: '#0e2f1c',
          700: '#164427',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      boxShadow: {
        'glow-green': '0 0 20px rgba(34,197,94,0.3)',
        'glow-sm':    '0 0 10px rgba(34,197,94,0.2)',
        'card':       '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-md':    '0 4px 16px rgba(0,0,0,0.08)',
        'card-lg':    '0 8px 32px rgba(0,0,0,0.12)',
      },
      animation: {
        fadeIn:      'fadeIn 0.35s ease-out',
        slideUp:     'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
        slideIn:     'slideIn 0.3s ease-out',
        float:       'float 6s ease-in-out infinite',
        floatDelay:  'float 8s ease-in-out 2s infinite',
        floatSlow:   'float 10s ease-in-out 4s infinite',
        shimmer:     'shimmer 2.5s linear infinite',
        glow:        'glow 3s ease-in-out infinite',
        pulseSlow:   'pulse 4s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(-6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%':   { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%':     { transform: 'translateY(-18px) rotate(2deg)' },
          '66%':     { transform: 'translateY(-8px) rotate(-1deg)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glow: {
          '0%,100%': { boxShadow: '0 0 10px rgba(34,197,94,0.2)' },
          '50%':     { boxShadow: '0 0 30px rgba(34,197,94,0.5)' },
        },
      },
    },
  },
  plugins: [],
};
