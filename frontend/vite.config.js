// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@config': path.resolve(__dirname, './config'),
      '@': path.resolve(__dirname, './frontend/src')
    }
  },
  server: {
    fs: {
      strict: false,
      allow: ['..']
    }
  },
  esbuild: {
    loader: 'jsx', // Enables JSX in .jsx files
    include: /src\/.*\.[tj]sx?$/, // Include .js, .jsx, .ts, .tsx files in src folder
    exclude: /node_modules/, // Exclude node_modules
  }
});
