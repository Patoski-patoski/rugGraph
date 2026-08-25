/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#090d16',
        surface: '#0f172a',
        'surface-elevated': '#1e293b',
        border: '#334155',
        primary: {
          DEFAULT: '#38bdf8',
          hover: '#0ea5e9',
          glow: 'rgba(56, 189, 248, 0.3)',
        },
        danger: {
          DEFAULT: '#f43f5e',
          hover: '#e11d48',
          glow: 'rgba(244, 63, 94, 0.3)',
        },
        warning: {
          DEFAULT: '#fbbf24',
          glow: 'rgba(251, 191, 36, 0.3)',
        },
        success: {
          DEFAULT: '#34d399',
          glow: 'rgba(52, 211, 153, 0.3)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s infinite ease-in-out',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.05)' },
        },
      },
    },
  },
  plugins: [],
};
