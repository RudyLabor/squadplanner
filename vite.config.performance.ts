import { defineConfig } from 'vite'
import { reactRouter } from '@react-router/dev/vite'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core essentials seulement
          core: ['react', 'react-dom'],

          // LiveKit uniquement quand nécessaire
          voice: ['@livekit/components-react'],

          // Supabase minimal
          auth: ['@supabase/supabase-js'],

          // Motion lazy-loaded
          motion: ['framer-motion'],

          // Heavy components async
          messages: ['src/pages/Messages.tsx'],
          profile: ['src/pages/Profile.tsx'],
        },
      },
    },

    // Compression aggressive
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.warn'],
      },
    },
  },

  plugins: [
    reactRouter(),

    // Bundle analyzer
    visualizer({
      filename: 'bundle-analysis.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
})
