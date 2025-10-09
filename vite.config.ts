// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor libraries into chunks
          react: ["react", "react-dom", "react-router-dom"],
          capacitor: ["@capacitor/core", "@capacitor/android", "@capacitor/ios", "@capacitor-community/admob"],
          supabase: ["@supabase/supabase-js"],
          query: ["@tanstack/react-query"],
        },
      },
      chunkFileNames: "assets/[name]-[hash].js",
    },
    chunkSizeWarningLimit: 600, // optional, increase limit if needed
  },
});
