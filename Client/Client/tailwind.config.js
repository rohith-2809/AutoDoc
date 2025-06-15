// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src//*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'], // Example: Using Poppins
      },
      colors: {
        'primary': '#1E293B', // Dark blue-gray
        'secondary': '#38BDF8', // Sky blue accent
        'light-text': '#E2E8F0', // Light gray text
        'dark-text': '#94A3B8', // Muted gray text
      }
    },
  },
  plugins: [],
}