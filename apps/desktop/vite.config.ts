import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Tauri expects a fixed port in dev mode
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      // Tell vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**'],
    },
  },
  // Allow importing from workspace packages
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  // Env vars for Tauri — use VITE_ prefix
  envPrefix: ['VITE_', 'TAURI_'],
});
