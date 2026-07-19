/** @type {import('tailwindcss').Config} */

import { TLG3D_BRAND_COLORS } from './packages/core/src/theme.ts';

export default {
  content: [
    './packages/ui/**/*.{jsx,tsx}',
    './packages/dashboard/**/*.{jsx,tsx}',
    './src/**/*.{jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        tlg: {
          // Primary - Green
          primary: {
            50: '#f0fdf4',
            100: '#dcfce7',
            200: '#bbf7d0',
            300: '#86efac',
            400: '#4ade80',
            500: TLG3D_BRAND_COLORS.primary.main,      // #00DD00
            600: TLG3D_BRAND_COLORS.primary.dark,      // #00AA00
            700: '#16a34a',
            800: '#15803d',
            900: '#166534',
            950: '#0f2817',
          },
          // Accent - Gold
          accent: {
            50: '#fffbeb',
            100: '#fef3c7',
            200: '#fde68a',
            300: '#fcd34d',
            400: '#fbbf24',
            500: TLG3D_BRAND_COLORS.accent.gold,       // #FFD700
            600: '#d97706',
            700: '#b45309',
            800: '#92400e',
            900: '#78350f',
            950: '#3f1d04',
          },
          // Neutral - Dark backgrounds
          dark: {
            50: '#f9fafb',
            100: '#f3f4f6',
            200: '#e5e7eb',
            300: '#d1d5db',
            400: '#9ca3af',
            500: '#6b7280',
            600: '#4b5563',
            700: TLG3D_BRAND_COLORS.neutral.darker,    // #1A1A1A
            800: TLG3D_BRAND_COLORS.neutral.dark,      // #0F0F0F
            900: '#111827',
            950: '#030712',
          },
        },
      },
      backgroundColor: {
        'tlg-primary': TLG3D_BRAND_COLORS.primary.main,
        'tlg-accent': TLG3D_BRAND_COLORS.accent.gold,
        'tlg-dark': TLG3D_BRAND_COLORS.neutral.dark,
        'tlg-darker': TLG3D_BRAND_COLORS.neutral.darker,
      },
      textColor: {
        'tlg-primary': TLG3D_BRAND_COLORS.primary.main,
        'tlg-accent': TLG3D_BRAND_COLORS.accent.gold,
        'tlg-light': TLG3D_BRAND_COLORS.neutral.light,
      },
      borderColor: {
        'tlg-primary': TLG3D_BRAND_COLORS.primary.main,
        'tlg-accent': TLG3D_BRAND_COLORS.accent.gold,
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'tlg-glow': `0 0 20px ${TLG3D_BRAND_COLORS.primary.main}80`,
        'tlg-glow-accent': `0 0 20px ${TLG3D_BRAND_COLORS.accent.gold}80`,
        'tlg-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'tlg-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'tlg-lg': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      },
      backgroundImage: {
        'tlg-gradient': `linear-gradient(135deg, ${TLG3D_BRAND_COLORS.primary.main}, ${TLG3D_BRAND_COLORS.accent.gold})`,
        'tlg-gradient-dark': `linear-gradient(135deg, ${TLG3D_BRAND_COLORS.primary.dark}, ${TLG3D_BRAND_COLORS.accent.light})`,
      },
      animation: {
        'tlg-pulse': 'tlg-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'tlg-glow': 'tlg-glow 2s ease-in-out infinite',
      },
      keyframes: {
        'tlg-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.8' },
        },
        'tlg-glow': {
          '0%, 100%': { boxShadow: `0 0 10px ${TLG3D_BRAND_COLORS.primary.main}40` },
          '50%': { boxShadow: `0 0 30px ${TLG3D_BRAND_COLORS.primary.main}80` },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
