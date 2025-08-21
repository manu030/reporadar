/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#000000',
        secondary: '#F5F1ED',
        accent: '#FF9B9B',
        warning: '#F4CC46',
        success: '#2D9B8B',
        'gray-text': '#4A4A4A',
        'periwinkle': '#8DA3E8',
        'card-bg': '#FFFFFF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        oi: ['Oi', 'system-ui', 'sans-serif'],
      },
      fontWeight: {
        'extrabold': '800',
      },
      boxShadow: {
        'brutal': '4px 4px 0px #000000',
        'brutal-sm': '2px 2px 0px #000000',
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
};