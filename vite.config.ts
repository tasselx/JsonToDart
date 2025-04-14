import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/json-to-dart-converter/',
  build: {
    outDir: 'docs',
    emptyOutDir: true
  },
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});