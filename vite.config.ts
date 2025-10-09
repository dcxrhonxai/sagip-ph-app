import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from '@tailwindcss/vite'; // Import the new Tailwind CSS plugin

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss() // Add the new Tailwind CSS plugin here
  ],
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
