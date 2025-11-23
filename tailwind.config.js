/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cyber-purple': '#a855f7',
        'cyber-pink': '#ec4899',
        'cyber-cyan': '#06b6d4',
        'neon-green': '#10b981',
        'neon-blue': '#3b82f6',
      },
      boxShadow: {
        'neon-green': '0 0 20px rgba(16, 185, 129, 0.5)',
        'neon-cyan': '0 0 20px rgba(6, 182, 212, 0.5)',
        'neon-purple': '0 0 20px rgba(168, 85, 247, 0.5)',
        'neon-pink': '0 0 20px rgba(236, 72, 153, 0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(16, 185, 129, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(16, 185, 129, 0.8)' },
        }
      }
    },
  },
  plugins: [],
}
