export default {content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dbe6ff',
          200: '#bdd0ff',
          300: '#90b1ff',
          400: '#5c86fb',
          500: '#365df0',
          600: '#2246d4',
          700: '#1c37ab',
          800: '#1b3187',
          900: '#1c2e6b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)',
        pop: '0 10px 30px rgba(15,23,42,0.12)',
      },
    },
  },
}
