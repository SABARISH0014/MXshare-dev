/** @type {import('tailwindcss').Config} */
module.exports = {
  // CRITICAL: Tells Tailwind where to look for CSS class names.
  // It scans all HTML, JSX, and JS files inside the src/ folder.
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  
  // Custom theme settings (optional, but good practice)
  theme: {
    extend: {
      colors: {
        'indigo-600': '#4f46e5', // Custom primary color alignment
        // You would add custom fonts, spacing, or breakpoints here
      },
    },
  },
  
  // Enables dark mode based on the 'class' attribute on the <html> tag
  darkMode: 'class',

  plugins: [],
}