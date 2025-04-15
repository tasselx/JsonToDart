import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/JsonToDart/',
  build: {
    outDir: 'docs',
    emptyOutDir: true
  },
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});