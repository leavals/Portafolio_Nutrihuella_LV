import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: "#10776F",
          tealDark: "#0C5B56",
          orange: "#F39C12",
          cream: "#FFF8EB",
          ink: "#111827",
          gray: "#6B7280",
        },
      },
      boxShadow: {
        soft: "0 10px 25px -10px rgba(16,119,111,0.15)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
