/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // https://www.davishumphries.com/blog/10-sophisticated-color-palettes
        // LUXE
        "classy-1": "#322D29",
        "classy-2": "#72383D",
        "classy-3": "#AC9C8D",
        "classy-4": "#D1C78D",
        "classy-5": "#D9D9D9",
        "classy-6": "#EFE9E1"
      }
    }
  },

  // for the popups
  safelist: [
    "bg-green-600",
    "bg-red-600"
  ],
  plugins: [],
}

