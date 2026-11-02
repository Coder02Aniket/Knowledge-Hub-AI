/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/knowledgehub/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/knowledgehub/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/knowledgehub/auth': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/knowledgehub/health': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../src/main/resources/static',
    emptyOutDir: true,
    sourcemap: false,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
