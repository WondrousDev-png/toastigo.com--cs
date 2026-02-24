/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        toast: {
          yellow: '#0084ff', 
          purple: '#5ec9ff',
          white: '#2c2c2c',
        },
        val: {
          pink: '#FFC5D3',   // Soft Pink
          red: '#FF4D6D',    // Hot Pink/Red
          dark: '#C9184A',   // Dark Red text
        }
      },
      fontFamily: {
        sans: ['Fredoka', 'sans-serif'], // This ensures the bubbly font
      },
      boxShadow: {
        'toast': '0px 6px 0px 0px #5A3E85',
        'val': '0px 6px 0px 0px #C9184A',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2.5rem', // Extra bubbly corners
      }
    },
  },
  plugins: [],
}