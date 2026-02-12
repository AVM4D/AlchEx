/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#050508',
        surface: { DEFAULT: '#0a0a0f', 2: '#111118', 3: '#1a1a24', light: '#1a1a24', lighter: '#242436' },
        border: { DEFAULT: 'rgba(255,255,255,0.06)', light: 'rgba(255,255,255,0.12)' },
        primary: {
          DEFAULT: '#8B5CF6', dark: '#7C3AED', light: '#A78BFA', glow: '#A78BFA',
          50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd',
          400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9',
          800: '#5b21b6', 900: '#4c1d95',
        },
        success: '#22c55e', warning: '#eab308', danger: '#ef4444', info: '#3b82f6',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['Space Grotesk', 'sans-serif'],
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #7C3AED, #A78BFA)',
        'gradient-dark': 'linear-gradient(135deg, #050508, #0a0a0f)',
        'gradient-glow': 'radial-gradient(circle at center, rgba(139,92,246,0.15) 0%, transparent 70%)',
        'gradient-mesh': 'radial-gradient(at 40% 20%, rgba(139,92,246,0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(59,130,246,0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(236,72,153,0.08) 0px, transparent 50%)',
      },
      boxShadow: {
        glow: '0 0 30px rgba(139,92,246,0.2)',
        'glow-lg': '0 0 60px rgba(139,92,246,0.3)',
        'glow-xl': '0 0 100px rgba(139,92,246,0.4)',
        glass: '0 8px 32px rgba(0,0,0,0.4)',
      },
      borderRadius: { '4xl': '2rem' },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'glow-pulse': 'pulse-glow 3s ease-in-out infinite',
        'spin-slow': 'rotate-slow 20s linear infinite',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards',
        'slide-down': 'slideDown 0.6s cubic-bezier(0.16,1,0.3,1) forwards',
        marquee: 'marquee 30s linear infinite',
        'marquee-slow': 'marquee 60s linear infinite',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-20px)' } },
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { transform: 'translateY(40px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        slideDown: { from: { transform: 'translateY(-40px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
      },
      transitionTimingFunction: {
        expo: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
