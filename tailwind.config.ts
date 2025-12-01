import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#060607",
        "bg-elevated": "#101114",
        "bg-soft": "#15161a",
        "border-subtle": "rgba(255,255,255,0.06)",
        "text-primary": "#ffffff",
        "text-secondary": "#a0a3ad",
        accent: "#d8ff3c",
        "accent-soft": "rgba(216,255,60,0.12)",
        danger: "#ff4b5c",
        success: "#20e3b2",
      },
      backgroundImage: {
        "main-gradient": "radial-gradient(circle at top left, #15161a 0, #060607 55%)",
        "shell-gradient": "linear-gradient(135deg, rgba(255,255,255,0.06), transparent)",
        "surface-gradient": "linear-gradient(135deg, #0c0d10, #050506)",
      }
    },
  },
  plugins: [],
};
export default config;

