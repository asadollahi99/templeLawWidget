import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "/ctlaw/" : "/",   // dev => '/', prod => '/ctlaw/'
  plugins: [react()],
  build: { outDir: "dist" },
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:8790", changeOrigin: true } // adjust port if needed
    }
  }
}));
