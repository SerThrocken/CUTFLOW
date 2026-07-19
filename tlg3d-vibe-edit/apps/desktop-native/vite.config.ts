import { defineConfig } from 'vite';
import react            from '@vitejs/plugin-react';
import path             from 'path';

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],

  // Vite dev server — Tauri reads from here in dev mode
  server: {
    port:         5173,
    strictPort:   true,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },

  // Env variables exposed to the frontend
  envPrefix: ['VITE_', 'TAURI_'],

  build: {
    outDir:    'dist',
    // Tauri requires ES modules
    target:    process.env.TAURI_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
    minify:    !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}));
