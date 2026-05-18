import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#A8D5BA",
        secondary: "#F4E4BA",
        accent: "#E8A87C",
        info: "#7C8B9E",
        rose: "#F4C2C2",
        lavender: "#C3B1E1",
        background: "#FFF8F0",
        foreground: "#2D2D2D",
      },
      fontFamily: {
        cartoon: ['"Nunito"', '"Baloo 2"', "sans-serif"],
      },
      borderWidth: {
        "3": "3px",
      },
      boxShadow: {
        cartoon: "4px 4px 0px #2D2D2D",
        "cartoon-sm": "2px 2px 0px #2D2D2D",
        "cartoon-hover": "2px 2px 0px #2D2D2D",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;