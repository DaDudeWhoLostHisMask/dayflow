import { defineConfig } from 'vite';

export default defineConfig({
  // Use relative base path to make the built files portable to any subdirectory (like GitHub Pages)
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
});
