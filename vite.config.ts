import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"), // makes `@` point to `src/`
    },
  },
  build: {
    rollupOptions: {
      // Prevent Vite from trying to bundle native-only Capacitor packages
      external: ["@capacitor/android", "@capacitor/ios"],
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          capacitor: ["@capacitor/core", "@capacitor-community/admob"], // web-safe only
          supabase: ["@supabase/supabase-js"],
          query: ["@tanstack/react-query"],
        },
        chunkFileNames: "assets/[name]-[hash].js",
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
