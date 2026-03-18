/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg)',
        surface: { DEFAULT: 'var(--surface)', 2: 'var(--surface-2)', 3: 'var(--surface-3)', light: 'var(--surface-3)', lighter: 'var(--surface-3)' },
        border: { DEFAULT: 'var(--border)', light: 'var(--border-hover)' },
        primary: {
          DEFAULT: 'var(--accent)', dark: 'var(--accent-3)', light: 'var(--accent-2)', glow: 'var(--accent-2)',
          50: 'var(--surface-3)', 100: 'var(--surface-2)', 200: 'var(--surface)', 300: 'var(--border)',
          400: 'var(--border-hover)', 500: 'var(--accent)', 600: 'var(--accent-2)', 700: 'var(--accent-3)',
          800: 'var(--text-3)', 900: 'var(--text-2)',
        },
        success: 'var(--green)', warning: 'var(--yellow)', danger: 'var(--red)', info: 'var(--accent)',
      },
      fontFamily: {
        logo: ['var(--font-logo)'],
        display: ['Space Grotesk', 'sans-serif'],
        quote: ['Great Vibes', 'cursive'],
        body: ['Space Grotesk', 'sans-serif'],
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, var(--accent), var(--accent-2))',
        'gradient-dark': 'linear-gradient(135deg, var(--bg), var(--surface))',
        'gradient-glow': 'radial-gradient(circle at center, var(--accent-glow) 0%, transparent 70%)',
        'gradient-mesh': 'radial-gradient(at 40% 20%, var(--accent-glow) 0px, transparent 50%), radial-gradient(at 80% 0%, var(--accent-sub) 0px, transparent 50%), radial-gradient(at 0% 50%, var(--accent-sub) 0px, transparent 50%)',
      },
      boxShadow: {
        glow: '0 0 30px var(--accent-glow)',
        'glow-lg': '0 0 60px var(--accent-glow)',
        'glow-xl': '0 0 100px var(--accent-glow)',
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
