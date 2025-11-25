/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Keeps your theme toggle working
  theme: {
    extend: {
      colors: {
        'indigo-600': '#4f46e5',
      },
      animation: {
        marquee: 'marquee 25s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
    },
  },
  plugins: [
    // Your 'dim' variant plugin
    plugin(function({ addVariant }) {
      addVariant('dim', '.dim &');
    })
  ],
}