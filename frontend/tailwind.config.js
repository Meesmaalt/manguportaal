/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: 'var(--bg, #030a16)',
          card: 'rgba(10, 25, 47, 0.9)',
          panel: '#0f172a',
        },
        gold: {
          DEFAULT: 'var(--gold, #dfb342)',
          hover: 'color-mix(in srgb, var(--gold, #dfb342) 70%, white)',
          dim: 'color-mix(in srgb, var(--gold, #dfb342) 70%, black)',
        },
        accent: {
          blue: '#1e3a8a',
          cyan: '#38bdf8',
          red: '#e62e4d',
          green: '#22c55e',
        },
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        gold: '0 0 20px rgba(var(--gold-rgb, 223, 179, 66), 0.4)',
        'gold-lg': '0 0 40px rgba(var(--gold-rgb, 223, 179, 66), 0.6)',
      },
    },
  },
  plugins: [],
}
