/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary blue colors
        primary: {
          DEFAULT: "#0867db",
          dark: "#0968db",
          light: "#407bff",
        },
        // Light blue backgrounds
        blue: {
          lightest: "#f6faff",
          lighter: "#e2edfb",
          light: "#e9f3ff",
          pale: "#c6dcf5",
        },
        // Gray text colors
        gray: {
          dark: "#343a40",
          DEFAULT: "#676767",
          medium: "#777",
          light: "#868e96",
          text: "#555",
        },
      },
      fontFamily: {
        sans: ['"Montserrat"', "sans-serif"],
        montserrat: ['"Montserrat"', "sans-serif"],
        armata: ['"Armata"', "sans-serif"],
        encode: ['"Encode Sans"', "sans-serif"],
        inter: ['"Inter"', "sans-serif"],
        roboto: ['"Roboto"', "sans-serif"],
      },
    },
  },
  plugins: [],
}