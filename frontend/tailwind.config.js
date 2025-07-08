/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Escanea todos tus componentes
  ],
  theme: {
    extend: {
      colors: {
        customBlue: '#182f6e',
        customBgGreen500: '#10b981',
        customBgGreen600: '#059669',
        customBgBlue500: '#3b82f6',
        customBgBlue600: '#2563eb',
        customBgPurple500: '#8b5cf6',
        customBgPurple600: '#7c3aed',
        customBgPink600: '#db2777',
        customBgPink700: '#be185d'
      },
    },
  },
  plugins: [
    require('@tailwindcss/line-clamp'),
  ],
};
