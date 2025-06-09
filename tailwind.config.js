/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Escanea todos tus componentes
  ],
  theme: {
    extend: {
      colors: {
        customBlue: '#182f6e',
      },
    },
  },
  plugins: [
    require('@tailwindcss/line-clamp'),
  ],
};
