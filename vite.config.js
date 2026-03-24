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
  },
  server: {
    // Better HMR for development
    hmr: {
      protocol: 'ws',
      timeout: 60000
    }
  }
})
