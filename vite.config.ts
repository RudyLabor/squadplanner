import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  // Build target flag: set BUILD_TARGET=native for Capacitor builds
  define: {
    __IS_NATIVE__: JSON.stringify(process.env.BUILD_TARGET === 'native'),
  },

  // Exclude Capacitor from web builds (10KB savings)
  resolve: {
    alias: {
      ...(process.env.BUILD_TARGET !== 'native' && {
        '@capacitor/core': fileURLToPath(new URL('./src/stubs/capacitor.ts', import.meta.url)),
        '@capacitor/haptics': fileURLToPath(new URL('./src/stubs/capacitor.ts', import.meta.url)),
        '@capacitor/local-notifications': fileURLToPath(new URL('./src/stubs/capacitor.ts', import.meta.url)),
        '@capacitor/push-notifications': fileURLToPath(new URL('./src/stubs/capacitor.ts', import.meta.url)),
      }),
    },
  },

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
        // Manual chunks for optimal caching
        // Normalize paths with forward slashes for cross-platform (Windows backslash fix)
        manualChunks: (id) => {
          const n = id.replace(/\\/g, '/');

          // Agora SDK - very heavy (~1.3MB), MUST be isolated and lazy-loaded
          if (n.includes('agora-rtc-sdk-ng') || n.includes('AgoraRTC')) {
            return 'vendor-agora';
          }
          // Sentry monitoring - loaded async only for authenticated users
          if (n.includes('@sentry')) {
            return 'vendor-sentry';
          }
          // Core: React + Router + State management (always needed)
          if (n.includes('/node_modules/react/') ||
              n.includes('/node_modules/react-dom/') ||
              n.includes('/node_modules/react-router') ||
              n.includes('zustand')) {
            return 'vendor-core';
          }
          // UI: animations, icons, toasts, effects
          if (n.includes('framer-motion') || n.includes('lucide-react') ||
              n.includes('sonner') || n.includes('confetti') || n.includes('countup')) {
            return 'vendor-ui';
          }
          // Data: Supabase + TanStack Query
          if (n.includes('@supabase') || n.includes('@tanstack')) {
            return 'vendor-data';
          }
        },

        // Keep named chunks for cache and debugging
        chunkFileNames: "assets/[name]-[hash].js",
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
