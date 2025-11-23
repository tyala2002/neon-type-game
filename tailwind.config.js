/** @type {import('tailwindcss').Config} */
// Force rebuild
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        glass: "rgba(255, 255, 255, 0.1)",
        glassBorder: "rgba(255, 255, 255, 0.2)",
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
