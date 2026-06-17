/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#1E6FD9",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
        },
        medical: {
          blue: "#1E6FD9",
          dark: "#2C3E50",
          green: "#27AE60",
          orange: "#F39C12",
          red: "#E74C3C",
          gray: "#7F8C8D",
          light: "#F5F7FA",
        },
      },
      fontFamily: {
        sans: ['"PingFang SC"', '"Microsoft YaHei"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
};
