import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Academic-Artistic Design System Core Palette
        paper: {
          light: '#FBFBF9', // Warm Paper
          dark: '#121316',  // Deep Charcoal
        },
        lacanian: {
          DEFAULT: '#0F766E', // Lacanian Turquoise
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          500: '#14B8A6',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        },
        lapis: {
          DEFAULT: '#1E3A8A', // Persian Lapis
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        ochre: {
          DEFAULT: '#B45309', // Ochre Gold
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
        },
        crimson: {
          DEFAULT: '#991B1B', // Deep Crimson / Dadkhahi
          50: '#FEF2F2',
          100: '#FEE2E2',
          500: '#EF4444',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },
        pillar: {
          psychoanalysis: '#0F766E',
          art: '#1E3A8A',
          strategy: '#B45309',
          dadkhahi: '#991B1B',
          rights: '#991B1B',
        },
      },
      fontFamily: {
        vazirmatn: ['Vazirmatn', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        cormorant: ['Vazirmatn', 'Cormorant Garamond', 'Georgia', 'serif'],
        inter: ['Vazirmatn', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        sans: ['Vazirmatn', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['Vazirmatn', 'Cormorant Garamond', 'Georgia', 'serif'],
        mono: ['Vazirmatn', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        display: ['Vazirmatn', 'Cormorant Garamond', 'serif'],
      },
      boxShadow: {
        'luxury': '0 10px 30px -10px rgba(0, 0, 0, 0.15)',
        'luxury-dark': '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [],
};

export default config;
