import { unstable_reactRouterRSC as reactRouterRSC } from "@react-router/dev/vite";
import rsc from "@vitejs/plugin-rsc";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { visualizer } from "rollup-plugin-visualizer";
import { fileURLToPath, URL } from "node:url";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// Auto-version the service worker on each build so browsers detect updates
function swVersionPlugin() {
  return {
    name: 'sw-auto-version',
    closeBundle() {
      // Framework mode outputs to build/client/ instead of dist/
      for (const dir of ['build/client', 'dist']) {
        try {
          const swPath = resolve(__dirname, `${dir}/sw.js`);
          const content = readFileSync(swPath, 'utf-8');
          const buildHash = Date.now().toString(36);
          const updated = content.replace(
            /const CACHE_VERSION = ['"].*?['"]/,
            `const CACHE_VERSION = 'v-${buildHash}'`
          );
          writeFileSync(swPath, updated);
          console.log(`[sw-auto-version] SW updated → v-${buildHash}`);
          break;
        } catch {
          // Try next directory
        }
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    reactRouterRSC(),
    rsc(),
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
    sourcemap: false,
    minify: "esbuild",
    target: "esnext",
    modulePreload: { polyfill: false },
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Manual chunks for vendor caching (React Router handles route splitting)
        manualChunks: (id) => {
          const n = id.replace(/\\/g, '/');
          if (n.includes('livekit-client') || n.includes('@livekit')) return 'vendor-livekit';
          if (n.includes('framer-motion')) return 'vendor-motion';
          if (n.includes('sonner')) return 'vendor-ui';
          if (n.includes('@tanstack')) return 'vendor-query';
          if (n.includes('@supabase')) return 'vendor-supabase';
          if (n.includes('canvas-confetti')) return 'vendor-confetti';
        },
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },

  // Dev server optimizations
  server: {
    warmup: {
      clientFiles: [
        "./src/root.tsx",
        "./src/routes/home.tsx",
        "./src/routes/messages.tsx",
      ],
    },
  },

  // Dependency optimization
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router",
      "framer-motion",
      "zustand",
      "@supabase/supabase-js",
    ],
    exclude: [],
  },

  // Enable JSON tree-shaking
  json: {
    stringify: true,
  },
});
