/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary brand colors
        primary: {
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
          950: '#1e1b4b',
        },
        // Dark UI surfaces
        dark: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          850: '#172033',
          900: '#0f172a',
          950: '#0a0e1a',
        },
        accent: {
          pink:   '#ec4899',
          violet: '#8b5cf6',
          cyan:   '#06b6d4',
          amber:  '#f59e0b',
          green:  '#10b981',
          red:    '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'ui-sans-serif', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
        'gradient-dark':    'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        'gradient-card':    'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        'gradient-glow':    'radial-gradient(ellipse at top, rgba(99,102,241,0.15) 0%, transparent 60%)',
      },
      boxShadow: {
        'glow-sm':  '0 0 15px rgba(99,102,241,0.25)',
        'glow':     '0 0 30px rgba(99,102,241,0.35)',
        'glow-lg':  '0 0 60px rgba(99,102,241,0.4)',
        'glass':    '0 8px 32px 0 rgba(0,0,0,0.37)',
        'card':     '0 4px 24px rgba(0,0,0,0.15)',
      },
      animation: {
        'spin-slow':    'spin 3s linear infinite',
        'pulse-slow':   'pulse 3s ease-in-out infinite',
        'bounce-slow':  'bounce 2s ease-in-out infinite',
        'slide-up':     'slideUp 0.3s ease-out',
        'slide-down':   'slideDown 0.3s ease-out',
        'fade-in':      'fadeIn 0.3s ease-out',
        'scale-in':     'scaleIn 0.2s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%':   { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',     opacity: '1' },
        },
        slideDown: {
          '0%':   { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',      opacity: '1' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%':   { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)',   opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
