import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  root: resolve(__dirname),
  base: './',
  server: {
    port: 5174,
  },
  build: {
    outDir: resolve(__dirname, '../../dist-spike'),
    emptyOutDir: true,
  },
});
