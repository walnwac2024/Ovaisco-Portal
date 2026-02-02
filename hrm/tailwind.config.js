// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
      colors: {
        customRed: 'rgb(var(--color-primary-rgb, 224 45 61) / <alpha-value>)',
        customLightGrey: '#94A3B8',
      },
    },
  },
  plugins: [],
};
