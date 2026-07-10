import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { resolve } from 'node:path';

// GitHub Pages serves from https://<user>.github.io/castle-guide/
// A blank page with 404'd assets is a FAILED phase gate.
export default defineConfig({
  base: '/castle-guide/',
  plugins: [preact()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 5173,
  },
  preview: {
    port: 4173,
    // Same base as production Pages — open http://localhost:4173/castle-guide/
    strictPort: true,
  },
});

