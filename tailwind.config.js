/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        husky: {
          blue: '#3085D6',
          purple: '#5B5696',
          gray: '#585858',
          green: '#578B26'
        }
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
        display: ['Fredoka One', 'cursive'],
      }
    },
  },
  plugins: [],
}