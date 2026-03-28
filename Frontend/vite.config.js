import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    global: 'window'
  },
  server: {
    proxy: {
      // Forward all /auth, /beds, /queue, /analytics, /ws requests to Spring Boot
      '/auth': { target: 'http://localhost:8080', changeOrigin: true },
      '/beds': { target: 'http://localhost:8080', changeOrigin: true },
      '/queue': { target: 'http://localhost:8080', changeOrigin: true },
      '/analytics': { target: 'http://localhost:8080', changeOrigin: true },
      '/ws': { target: 'http://localhost:8080', changeOrigin: true, ws: true },
      '/wards': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
})
