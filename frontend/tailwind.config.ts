import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        headline: ["var(--font-manrope)", "Manrope", "sans-serif"],
        body:     ["var(--font-inter)",   "Inter",   "sans-serif"],
        label:    ["var(--font-inter)",   "Inter",   "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1.5rem",
      },
      colors: {
        primary: "#176a21",
        "primary-dim": "#025d16",
        "primary-container": "#9df197",
        "primary-fixed": "#9df197",
        "primary-fixed-dim": "#90e28a",
        "on-primary": "#d1ffc8",
        "on-primary-container": "#005c15",
        "on-primary-fixed": "#00460e",
        "on-primary-fixed-variant": "#12661e",
        "inverse-primary": "#9df197",

        secondary: "#006666",
        "secondary-dim": "#005959",
        "secondary-container": "#8dedec",
        "secondary-fixed": "#8dedec",
        "secondary-fixed-dim": "#7fdede",
        "on-secondary": "#bbfffe",
        "on-secondary-container": "#005858",
        "on-secondary-fixed": "#004343",
        "on-secondary-fixed-variant": "#006262",

        tertiary: "#a83206",
        "tertiary-dim": "#952800",
        "tertiary-container": "#ff9473",
        "tertiary-fixed": "#ff9473",
        "tertiary-fixed-dim": "#ff7d55",
        "on-tertiary": "#ffefeb",
        "on-tertiary-container": "#5f1600",
        "on-tertiary-fixed": "#340800",
        "on-tertiary-fixed-variant": "#6e1c00",

        error: "#b02500",
        "error-dim": "#b92902",
        "error-container": "#f95630",
        "on-error": "#ffefec",
        "on-error-container": "#520c00",

        background: "#f6f6f6",
        "on-background": "#2d2f2f",
        surface: "#f6f6f6",
        "surface-bright": "#f6f6f6",
        "surface-dim": "#d3d5d5",
        "surface-tint": "#176a21",
        "surface-variant": "#dbdddd",
        "surface-container": "#e7e8e8",
        "surface-container-low": "#f0f1f1",
        "surface-container-lowest": "#ffffff",
        "surface-container-high": "#e1e3e3",
        "surface-container-highest": "#dbdddd",
        "on-surface": "#2d2f2f",
        "on-surface-variant": "#5a5c5c",
        "inverse-surface": "#0c0f0f",
        "inverse-on-surface": "#9c9d9d",

        outline: "#767777",
        "outline-variant": "#acadad",
      },
    },
  },
  plugins: [],
};

export default config;
