import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Use relative asset paths so GitHub Pages (repo subpath) can find the built files
  base: "./",
  plugins: [react()],
  server: {
    port: 5173
  }
});
