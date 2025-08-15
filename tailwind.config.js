/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff5f3',
          100: '#ffe9e6',
          200: '#fed6cd',
          300: '#fcb6a6',
          400: '#f98a6f',
          500: '#FC6D36', // primary color
          600: '#e85e2e',
          700: '#c24d25',
          800: '#9d3f1f',
          900: '#7e361b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}