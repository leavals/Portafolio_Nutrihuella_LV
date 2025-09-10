import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        nh: {
          teal:  "#0E7C86", // títulos / botones secundarios
          green: "#2ECC71", // CTA primario
          dark:  "#0C3B3E", // texto fuerte
          orange:"#F39C12", // iconos / llamado
          coral: "#E74C3C", // alertas
          ink:   "#111111",
          gray:  "#62676C",
          bg:    "#F5FAF9", // fondo suave
          cream: "#FFF8EB", // crema para secciones
        },
      },
    },
  },
  plugins: [],
};
export default config;
