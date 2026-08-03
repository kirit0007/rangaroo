import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: "#FF6B35",
          "orange-dark": "#E85520",
          yellow: "#FFD23F",
          purple: "#7B2FF7",
          "purple-light": "#9D5CFF",
          pink: "#FF69B4",
          green: "#4CAF50",
          cream: "#FFF9F2",
          dark: "#1E1B18",
        },
      },
      fontFamily: {
        heading: ["var(--font-fredoka)", "Fredoka", "cursive", "sans-serif"],
        body: ["var(--font-nunito)", "Nunito", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        fun: "0 10px 25px -5px rgba(255, 107, 53, 0.25), 0 8px 10px -6px rgba(255, 107, 53, 0.1)",
        purple: "0 10px 25px -5px rgba(123, 47, 247, 0.25)",
        card: "0 15px 35px -5px rgba(0, 0, 0, 0.05), 0 5px 15px -5px rgba(0, 0, 0, 0.03)",
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.07)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        bounceSlow: {
          "0%, 100%": { transform: "translateY(-5%)", animationTimingFunction: "cubic-bezier(0.8,0,1,1)" },
          "50%": { transform: "translateY(0)", animationTimingFunction: "cubic-bezier(0,0,0.2,1)" }
        }
      },
      animation: {
        float: "float 4s ease-in-out infinite",
        wiggle: "wiggle 1s ease-in-out infinite",
        "bounce-slow": "bounceSlow 2s infinite",
      },
    },
  },
  plugins: [],
};
export default config;
