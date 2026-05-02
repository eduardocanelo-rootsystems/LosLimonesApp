import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Jost', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: [
          'ui-monospace',
          'SF Mono',
          'Menlo',
          'Consolas',
          'Liberation Mono',
          'monospace',
        ],
      },
      colors: {
        // Paleta /root — fondo oscuro con cyan acento
        ink: {
          DEFAULT: '#0e1014',
          50: '#f6f7f8',
          100: '#e8eaee',
          200: '#c8ccd3',
          300: '#9ba1ad',
          400: '#6b7281',
          500: '#4a505d',
          600: '#363a44',
          700: '#262931',
          800: '#1a1d21',
          900: '#13161a',
          950: '#0e1014',
        },
        accent: {
          DEFAULT: '#B7FF00',
          50:  '#f7ffe0',
          100: '#eaffb8',
          200: '#d9ff80',
          300: '#c8ff4d',
          400: '#bcff1a',
          500: '#B7FF00',
          600: '#92cc00',
          700: '#6d9900',
          800: '#496600',
          900: '#243300',
        },
        // Cyan /root — solo para el bloque /root del header
        sys: {
          DEFAULT: '#00e5ff',
          400: '#1ad4ff',
          500: '#00e5ff',
          600: '#00b8cc',
        },
        // Paleta Los Limones Creativos
        limones: {
          carbon:  '#1F1F1F',
          grafito: '#5E5E5E',
          blanco:  '#F4F4F4',
          lima:    '#B7FF00',
        },
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#3b82f6',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
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
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
      },
    },
  },
  plugins: [],
}

export default config
