/** @type {import('tailwindcss').Config} */
export default {
  // --- ADD THIS LINE ---
  darkMode: 'class', 
  // ---------------------

  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // This scans all your files
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}