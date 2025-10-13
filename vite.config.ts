import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// ✅ Vite configuration optimized for React + Leaflet
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    // Pre-bundle these to avoid ESM import issues
    include: ["react-leaflet", "leaflet"],
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
  server: {
    fs: {
      // Allow Vite to serve files from one level up
      allow: [".."],
    },
  },
});
