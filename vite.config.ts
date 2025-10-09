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
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          capacitor: ["@capacitor/core", "@capacitor/android", "@capacitor/ios", "@capacitor-community/admob"],
          supabase: ["@supabase/supabase-js"],
          query: ["@tanstack/react-query"],
        },
      },
      chunkFileNames: "assets/[name]-[hash].js",
    },
    chunkSizeWarningLimit: 600,
  },
});
