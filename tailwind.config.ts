import type { Config } from "tailwindcss";

// "Crimson Velvet" theme — #2C0F12 → #6B1E23 with thin light hairlines.
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "rgb(var(--brand) / <alpha-value>)",
          fg: "rgb(var(--brand-fg) / <alpha-value>)",
        },
        night: "#150709", // page background
        paper: "#1c0a0d", // footer / subtle panels
        surface: { DEFAULT: "#2C0F12", 2: "#3a1519", 3: "#4a1b20" },
        crimson: { DEFAULT: "#6B1E23", light: "#8a2a30", dark: "#2C0F12" },
        ink: { DEFAULT: "#f6ecec", soft: "#dcc7c8", muted: "#a68b8d" },
        line: "rgba(255, 228, 228, 0.14)",
        rose: "#e8a9a2",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "ui-sans-serif", "sans-serif"],
      },
      borderRadius: { DEFAULT: "10px" },
      maxWidth: { site: "1200px" },
      backgroundImage: {
        velvet: "linear-gradient(100deg, #2C0F12 0%, #6B1E23 100%)",
        "velvet-rev": "linear-gradient(100deg, #6B1E23 0%, #2C0F12 100%)",
        "velvet-page": "radial-gradient(1200px 600px at 50% -10%, rgba(107,30,35,0.35), transparent 70%)",
      },
      boxShadow: {
        velvet: "0 18px 40px -18px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.06)",
      },
    },
  },
  plugins: [],
} satisfies Config;
