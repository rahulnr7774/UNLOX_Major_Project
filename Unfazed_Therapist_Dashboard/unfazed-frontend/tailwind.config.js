/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
      },
      colors: {
        ink: '#1f2924',
        moss: '#486653',
        sage: '#dfe9df',
        cream: '#f7f7f1',
        coral: '#ef8e70',
      },
    },
  },
  plugins: [],
}