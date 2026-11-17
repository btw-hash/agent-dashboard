import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3737',
        changeOrigin: true,
      },
      // the office server only lets its own page listen in, so the Host header must stay ours
      '/ws': {
        target: 'ws://localhost:3737',
        ws: true,
      },
    },
  },
});
