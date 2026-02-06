import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  // Performance optimizations
  build: {
    // Enable source maps for debugging in production (optional)
    sourcemap: false,

    // Minification settings
    minify: "esbuild",
    target: "esnext",

    // Chunk size warnings
    chunkSizeWarningLimit: 500,

    // Rolldown code splitting configuration (Vite 7+)
    rollupOptions: {
      output: {
        // Manual chunks for optimal caching - function form for better control
        manualChunks: (id) => {
          // Agora SDK - very heavy, MUST be isolated
          if (id.includes('agora-rtc-sdk-ng')) {
            return 'vendor-agora';
          }
          // React core - frequently used, cached separately
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router')) {
            return 'vendor-react';
          }
          // UI libraries
          if (id.includes('framer-motion') || id.includes('lucide-react')) {
            return 'vendor-ui';
          }
          // State management
          if (id.includes('zustand')) {
            return 'vendor-state';
          }
          // Supabase
          if (id.includes('@supabase')) {
            return 'vendor-supabase';
          }
          // Confetti libraries
          if (id.includes('confetti')) {
            return 'vendor-confetti';
          }
          // Capacitor mobile plugins
          if (id.includes('@capacitor')) {
            return 'vendor-capacitor';
          }
        },

        // Optimize chunk file names for caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split("/").pop()?.replace(".tsx", "").replace(".ts", "")
            : "chunk";
          return `assets/${facadeModuleId}-[hash].js`;
        },
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },

  // Dev server optimizations
  server: {
    // Pre-bundle heavy dependencies
    warmup: {
      clientFiles: [
        "./src/App.tsx",
        "./src/pages/Home.tsx",
        "./src/pages/Messages.tsx",
      ],
    },
  },

  // Dependency optimization
  optimizeDeps: {
    // Pre-bundle these for faster dev startup
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "framer-motion",
      "zustand",
      "@supabase/supabase-js",
      "lucide-react",
    ],
    // Exclude heavy libs from pre-bundling (lazy loaded)
    exclude: ["agora-rtc-sdk-ng"],
  },

  // Enable JSON tree-shaking
  json: {
    stringify: true,
  },
});
