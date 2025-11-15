import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          900: "#0f172a",
          950: "#020617",
        },
      },
      fontFamily: {
        sans: ["Space Grotesk", "sans-serif"],
      },
      backgroundImage: {
        "linear-to-b": "linear-gradient(to bottom, var(--tw-gradient-stops))",
        "linear-to-r": "linear-gradient(to right, var(--tw-gradient-stops))",
        "linear-to-br": "linear-gradient(to bottom right, var(--tw-gradient-stops))",
      },
      animation: {
        scroll: "scroll 20s linear infinite",
      },
      keyframes: {
        scroll: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(calc(-100% - 1rem))" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
