import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        malachite: {
          '50': '#f4f7fb',
          '100': '#e7f0f7',
          '200': '#cadeed',
          '300': '#9bc2de',
          '400': '#66a2ca',
          '500': '#3e7ea8',
          '600': '#316c98',
          '700': '#29577b',
          '800': '#254a67',
          '900': '#244056',
          '950': '#182939',
      },
      },
    },
  },
  plugins: [],
};

export default config;
