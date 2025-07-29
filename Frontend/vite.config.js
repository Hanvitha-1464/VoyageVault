import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',  // Ensures correct asset paths
  build: {
    outDir: 'dist',  // Make sure this matches what you deployed
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://localhost:8080/',
        changeOrigin: true,
      }
    },
    watch: {
      usePolling: true,
    }
  }
});