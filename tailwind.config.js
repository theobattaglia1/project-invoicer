
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: '#1db954',
        sidebar: '#1c1c1e',
      },
      spacing: {
        content: 'min(90ch,100%)',
      },
    },
  },
  plugins: [],
}