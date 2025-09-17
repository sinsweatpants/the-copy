/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      container: { center: true },
      fontFamily: { sans: ["ui-sans-serif", "system-ui"] },
    },
  },
  plugins: [],
};