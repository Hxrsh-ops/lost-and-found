/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Foundation & Canvas
        app: {
          bg: '#F6F6F4',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#F1F1EF',
          hover: '#FAFAFA',
          border: '#E5E5E2',
          'border-subtle': '#EEEEEC',
          'border-strong': '#D4D4D0',
        },
        // Ink & Typography
        ink: {
          DEFAULT: '#111111',
          secondary: '#6B6B68',
          muted: '#A1A19D',
          faint: '#D4D4D0',
        },
        // Primary Accent
        accent: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          subtle: '#EFF6FF',
          border: '#BFDBFE',
        },
        // Semantic Accents
        found: {
          DEFAULT: '#059669',
          hover: '#047857',
          bg: '#ECFDF5',
          text: '#065F46',
          border: '#A7F3D0',
        },
        lost: {
          DEFAULT: '#DC2626',
          hover: '#B91C1C',
          bg: '#FEF2F2',
          text: '#991B1B',
          border: '#FECACA',
        },
        warning: {
          DEFAULT: '#D97706',
          bg: '#FFFBEB',
          text: '#92400E',
          border: '#FDE68A',
        },
      },
      fontFamily: {
        sans: [
          '"Inter"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'monospace',
        ],
      },
      borderRadius: {
        'xs': '4px',
        'sm': '6px',
        'md': '8px',
        'lg': '10px',
        'xl': '12px',
        '2xl': '16px',
        'pill': '9999px',
      },
      boxShadow: {
        'subtle': '0 1px 2px rgba(0, 0, 0, 0.04)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        'card-hover': '0 4px 12px -2px rgba(0, 0, 0, 0.06), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
        'dropdown': '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.03)',
        'modal': '0 20px 40px -10px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
}
