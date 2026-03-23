/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Syne', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        surface: {
          900: '#0a0a0f',
          800: '#111118',
          700: '#16161f',
          600: '#1c1c28',
          500: '#232333',
          400: '#2d2d42',
          300: '#3a3a52',
        },
        accent: {
          cyan:    '#22d3ee',
          emerald: '#10b981',
          amber:   '#f59e0b',
          rose:    '#f43f5e',
          violet:  '#8b5cf6',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'grid-pattern': "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-in':     'fadeIn 0.3s ease-out',
        'slide-up':    'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
        'slide-right': 'slideRight 0.3s ease-out',
        'pulse-slow':  'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'shimmer':     'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn:     { from: { opacity: '0' },                    to: { opacity: '1' } },
        slideUp:    { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideRight: { from: { opacity: '0', transform: 'translateX(-16px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        shimmer:    { from: { backgroundPosition: '-200% 0' },   to: { backgroundPosition: '200% 0' } },
      },
      boxShadow: {
        'glow-brand':   '0 0 20px rgba(99,102,241,0.3)',
        'glow-cyan':    '0 0 20px rgba(34,211,238,0.3)',
        'glow-emerald': '0 0 20px rgba(16,185,129,0.3)',
        'card':         '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        'card-hover':   '0 4px 20px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
};
