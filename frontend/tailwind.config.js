/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html", // Include the HTML file in the root
    "./src/**/*.{js,jsx,ts,tsx}", // Include all JavaScript/TypeScript and JSX/TSX files in the src folder
  ],
  theme: {
    extend: {
      colors: {
        white: "#FFFFFF", // White (already default in Tailwind)
        darkGray: "#999999", // Custom dark gray color
        textBlack: "#2d2e2d", // Custom text black color
      },
      fontFamily: {
        sans: ["Poppins", "sans-serif"], // Applying Poppins font family globally
      },
      transformOrigin: {
        center: "50% 50%",
      },
      rotate: {
        y: "180deg",
      },
    },
  },
  plugins: [],
};
