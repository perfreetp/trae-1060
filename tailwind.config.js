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
          50: "#E7EDF8",
          100: "#C3D1EE",
          200: "#9FB3E3",
          300: "#7B95D9",
          400: "#5777CF",
          500: "#3E92CC",
          600: "#0A2463",
          700: "#081D4F",
          800: "#06153B",
          900: "#040E27",
        },
        alert: {
          danger: "#D62828",
          warning: "#F77F00",
          caution: "#FCBF49",
          info: "#0096C7",
          success: "#38B000",
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', "sans-serif"],
        mono: ['"Roboto Mono"', "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
