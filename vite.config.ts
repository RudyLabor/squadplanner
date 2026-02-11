import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
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

// React Compiler — auto-memoization for client components (Phase 1.3)
// Only transforms "use client" files for safety with SSR/server components
function reactCompilerPlugin(): import('vite').Plugin {
  let babel: typeof import('@babel/core');
  return {
    name: 'react-compiler',
    enforce: 'pre',
    async buildStart() {
      babel = await import('@babel/core');
    },
    async transform(code, id) {
      if (id.includes('node_modules')) return;
      if (!/\.tsx?$/.test(id)) return;
      if (!code.includes('"use client"') && !code.includes("'use client'")) return;

      const result = await babel.transformAsync(code, {
        babelrc: false,
        configFile: false,
        filename: id,
        parserOpts: {
          sourceType: 'module',
          plugins: ['typescript', 'jsx'],
        },
        plugins: [['babel-plugin-react-compiler', {}]],
        sourceMaps: true,
      });

      if (!result?.code) return;
      return { code: result.code, map: result.map };
    },
  };
}

// https://vite.dev/config/
export default defineConfig(async () => {
  // Dynamic import: only load visualizer when ANALYZE is set (devDependency)
  const analyzePlugin = process.env.ANALYZE === 'true'
    ? (await import('rollup-plugin-visualizer')).visualizer({
        filename: 'dist/bundle-analysis.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
        template: 'treemap',
      })
    : null;

  return {
  plugins: [
    reactCompilerPlugin(),
    reactRouter(),
    tailwindcss(),
    swVersionPlugin(),
    analyzePlugin,
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
          // Vendor chunks — heavy libs cached separately
          if (n.includes('livekit-client') || n.includes('@livekit')) return 'vendor-livekit';
          if (n.includes('framer-motion') || n.includes('motion-dom') || n.includes('motion-utils')) return 'vendor-motion';
          if (n.includes('@tanstack')) return 'vendor-query';
          if (n.includes('@supabase')) return 'vendor-supabase';
          if (n.includes('canvas-confetti')) return 'vendor-confetti';
          // Group small vendor modules into vendor-ui to reduce micro-chunks
          if (n.includes('node_modules/')) {
            if (n.includes('sonner') || n.includes('zustand') || n.includes('zod')) return 'vendor-ui';
          }
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
};
});
