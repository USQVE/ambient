/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: { 'antiqua': ['"Cormorant Garamond"', 'serif'] }
    },
  },
  plugins: [],
  safelist: [
    { pattern: /^data-\[atmo=.*/ },
  ],
}
