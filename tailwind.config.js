/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        // Brand palette — deep navy + amber gold
        brand: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#c2d4ff',
          300: '#93b4ff',
          400: '#6090ff',
          500: '#3d6ef5',
          600: '#2651ea',
          700: '#1e3fd8',
          800: '#1e35ae',
          900: '#1e3088',
          950: '#151f52',
        },
        gold: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // Surface colors for dark premium UI
        surface: {
          0:   '#0a0d14',   // deepest background
          50:  '#0d1017',
          100: '#111520',
          200: '#161b2e',
          300: '#1c2340',
          400: '#222b50',
          500: '#2a3562',
          600: '#344070',
        },
        // Semantic
        success:  { DEFAULT: '#22c55e', light: '#86efac', dark: '#15803d' },
        warning:  { DEFAULT: '#f59e0b', light: '#fde68a', dark: '#b45309' },
        danger:   { DEFAULT: '#ef4444', light: '#fca5a5', dark: '#b91c1c' },
        info:     { DEFAULT: '#3b82f6', light: '#93c5fd', dark: '#1d4ed8' },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-pattern': "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(61,110,245,0.25) 0%, transparent 70%)",
        'card-shine': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 60%)',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0,0,0,0.4), 0 1px 2px -1px rgba(0,0,0,0.4)',
        'card-hover': '0 4px 16px 0 rgba(0,0,0,0.5), 0 2px 4px -1px rgba(0,0,0,0.3)',
        'glass': '0 8px 32px 0 rgba(0,0,0,0.36)',
        'glow-brand': '0 0 20px rgba(61,110,245,0.3)',
        'glow-gold': '0 0 20px rgba(245,158,11,0.25)',
        'glow-success': '0 0 16px rgba(34,197,94,0.25)',
      },
      borderRadius: {
        'xl2': '1rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'shimmer': 'shimmer 1.8s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
