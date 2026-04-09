import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Code splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunk for node_modules
          if (id.includes('node_modules')) {
            if (id.includes('supabase')) return 'vendor-supabase';
            if (id.includes('react')) return 'vendor-react';
            return 'vendor';
          }
        }
      }
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 600,
    // Production optimizations - use esbuild (default, no extra dependency needed)
    minify: 'esbuild',
    // CSS optimization
    cssCodeSplit: true,
    cssMinify: true,
    // Source maps for production debugging (can be disabled)
    sourcemap: false,
    // Report compressed size
    reportCompressedSize: true,
    // Optimize images and assets
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
    assetsDir: 'assets',
    // Manifest for resource preloading
    emptyOutDir: true,
  },
  server: {
    // Better HMR for development
    hmr: {
      protocol: 'ws',
      timeout: 60000
    },
    // Enable compression in dev
    middlewareMode: false,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', '@supabase/supabase-js'],
    exclude: ['@anthropic-ai/sdk', '@google/generative-ai']
  }
})
