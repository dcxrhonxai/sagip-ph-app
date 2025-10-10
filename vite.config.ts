import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"), // `@` points to `src/`
    },
  },
  optimizeDeps: {
    include: ["axios"], // Ensure axios is pre-bundled
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          supabase: ["@supabase/supabase-js"],
          query: ["@tanstack/react-query"],
        },
        chunkFileNames: "assets/[name]-[hash].js",
      },
      // Externalize packages if you want them to be loaded from CDN
      external: [],
    },
    chunkSizeWarningLimit: 600,
  },
});
