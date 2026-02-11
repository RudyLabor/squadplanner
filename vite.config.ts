import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";
import { fileURLToPath, URL } from "node:url";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// Auto-version the service worker on each build so browsers detect updates
function swVersionPlugin() {
  return {
    name: 'sw-auto-version',
    closeBundle() {
      const swPath = resolve(__dirname, 'dist/sw.js');
      try {
        const content = readFileSync(swPath, 'utf-8');
        const buildHash = Date.now().toString(36);
        const updated = content.replace(
          /const CACHE_VERSION = ['"].*?['"]/,
          `const CACHE_VERSION = 'v-${buildHash}'`
        );
        writeFileSync(swPath, updated);
        console.log(`[sw-auto-version] SW updated → v-${buildHash}`);
      } catch {
        // sw.js not in dist (dev mode), skip silently
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          ['babel-plugin-react-compiler', {}]
        ]
      }
    }),
    tailwindcss(),
    swVersionPlugin(),
    process.env.ANALYZE === 'true' && visualizer({
      filename: 'dist/bundle-analysis.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap',
    }),
  ].filter(Boolean),

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

  // Strip console.log/warn/info/debug from production builds (keep console.error)
  esbuild: {
    pure: process.env.NODE_ENV === 'production'
      ? ['console.log', 'console.warn', 'console.info', 'console.debug']
      : [],
  },

  // Performance optimizations
  build: {
    // Enable source maps for debugging in production (optional)
    sourcemap: false,

    // Minification settings
    minify: "esbuild",
    target: "esnext",

    // Skip modulePreload polyfill for modern browsers (saves ~2KB)
    modulePreload: { polyfill: false },

    // Chunk size warnings
    chunkSizeWarningLimit: 500,

    // Rolldown code splitting configuration (Vite 7+)
    rollupOptions: {
      output: {
        // Manual chunks for optimal caching and parallel loading
        // Normalize paths with forward slashes for cross-platform (Windows backslash fix)
        manualChunks: (id) => {
          const n = id.replace(/\\/g, '/');

          // LiveKit SDK - lightweight (~100KB), separate chunk for caching
          if (n.includes('livekit-client') || n.includes('@livekit')) {
            return 'vendor-livekit';
          }
          // Sentry monitoring - loaded async only for authenticated users
          if (n.includes('@sentry')) {
            return 'vendor-sentry';
          }
          // Core: React + ReactDOM + Router (always needed on every page)
          if (n.includes('/node_modules/react/') ||
              n.includes('/node_modules/react-dom/') ||
              n.includes('/node_modules/react-router')) {
            return 'vendor-react';
          }
          // State management: Zustand (small, always needed)
          if (n.includes('zustand')) {
            return 'vendor-react';
          }
          // Animations: framer-motion is ~60KB gzipped, separate chunk for caching
          if (n.includes('framer-motion')) {
            return 'vendor-motion';
          }
          // Icons: lucide-react tree-shakes but still ~20KB, cache separately
          if (n.includes('lucide-react')) {
            return 'vendor-icons';
          }
          // UI utilities: sonner (toasts), react-countup
          if (n.includes('sonner') || n.includes('react-countup')) {
            return 'vendor-ui';
          }
          // Data layer: TanStack Query
          if (n.includes('@tanstack')) {
            return 'vendor-query';
          }
          // Data layer: Supabase client
          if (n.includes('@supabase')) {
            return 'vendor-supabase';
          }
          // Confetti libraries - only loaded on celebrations
          if (n.includes('canvas-confetti') || n.includes('react-confetti')) {
            return 'vendor-confetti';
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
    exclude: [],
  },

  // Enable JSON tree-shaking
  json: {
    stringify: true,
  },
});
