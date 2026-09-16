import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-tfjs': ['@tensorflow/tfjs', '@tensorflow-models/coco-ssd'],
          'vendor-motion': ['framer-motion'],
          'vendor-pdf': ['jspdf'],
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
});

