/**
 * PostCSS Configuration for Vite/Tailwind Compilation.
 * * This file tells Vite's build process to run Tailwind CSS and Autoprefixer
 * on the CSS files, compiling the utility classes into static, optimized CSS.
 */
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}