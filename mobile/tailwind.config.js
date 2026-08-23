/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#090d16",
        cardBg: "#0f172a",
        borderDark: "#1e293b",
        accentEmerald: "#10b981",
        accentRose: "#ef4444",
        accentSky: "#38bdf8",
        accentIndigo: "#818cf8",
        accentAmber: "#f59e0b"
      }
    },
  },
  plugins: [],
}
