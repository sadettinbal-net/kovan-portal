import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        phone: "390px", // 6.1-6.9 inç telefonlar (iPhone 14, Samsung S23 vb.)
      },
      colors: {
        primary: {
          DEFAULT: "#1a3a6b",
          dark: "#0f2548",
          light: "#2554a0",
        },
        accent: {
          DEFAULT: "#e8a020",
          dark: "#c8851a",
        },
      },
    },
  },
  plugins: [],
};
export default config;
