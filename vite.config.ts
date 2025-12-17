import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Ensure assets resolve correctly on GitHub Pages (repo subpath)
  base: "/LondonPathfindingVisualiser/",
  plugins: [react()],
  server: {
    port: 5173
  }
});
