import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    rollupOptions: {
      // Prevent Vite from bundling Capacitor plugins for SSR / web
      external: ["@capacitor/admob", "@capacitor/core"],
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
